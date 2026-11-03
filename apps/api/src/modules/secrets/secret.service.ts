import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'
import { AuditService } from '../../shared/services/audit.service'
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto'
import type { AuthenticatedSession } from '../../shared/guards/auth.guard'
import { CreateSecretDto, ImportSecretsDto, UpdateSecretDto } from './dto/secret.dto'
import { encrypt, decrypt } from '../../shared/utils/encryption.util'
import { openBackup, sealBackup, type BackupFile, type BackupSecret } from './backup-crypto'

const MASK = '••••••••'
// Revealing or exporting values requires a password entered within this window.
export const REAUTH_WINDOW_MS = 15 * 60 * 1000

export interface RestoreResult {
  created: number
  restored: number
  skipped: number
}

export interface ImportResult extends RestoreResult {
  dryRun: boolean
}

// A secret is identified by what it is for and which account it belongs to.
const identityOf = (key: string, username: string) => `${key}\u0000${username}`
const describeIdentity = (key: string, username: string) => (username ? `"${key}" for ${username}` : `"${key}"`)

// Importing up to 2000 rows in one transaction takes longer than Prisma's default 5 seconds.
const BULK_TRANSACTION = { timeout: 30_000 }

@Injectable()
export class SecretService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  assertRecentSignIn(session: AuthenticatedSession | null, now = Date.now()): void {
    const signedInAt = session?.createdAt ? Date.parse(session.createdAt) : NaN
    if (!Number.isFinite(signedInAt) || now - signedInAt > REAUTH_WINDOW_MS) {
      throw new ForbiddenException({ message: 'Confirm your password to continue.', error: 'REAUTH_REQUIRED' })
    }
  }

  async findAll(userId: string, query: PaginationQueryDto) {
    const secrets = await this.prisma.secret.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    })

    // Never return the real value in list view
    return secrets.map(s => ({ ...s, value: MASK }))
  }

  async findOne(id: string, userId: string) {
    const secret = await this.prisma.secret.findFirst({
      where: { id, userId, deletedAt: null },
    })
    if (!secret) throw new NotFoundException('Secret not found')
    return { ...secret, value: MASK }
  }

  async reveal(id: string, userId: string, session: AuthenticatedSession | null) {
    this.assertRecentSignIn(session)
    const secret = await this.prisma.secret.findFirst({
      where: { id, userId, deletedAt: null },
    })
    if (!secret) throw new NotFoundException('Secret not found')

    await this.auditService.log(userId, 'REVEAL_SECRET', 'secret', id, {
      key: secret.key,
      name: secret.name,
    })

    return { ...secret, value: decrypt(secret.value) }
  }

  // Key and username stay unique per user even after a delete, so a deleted row with the same identity is reused.
  async create(userId: string, dto: CreateSecretDto) {
    const username = dto.username ?? ''
    const data = {
      name: dto.name,
      value: encrypt(dto.value),
      url: dto.url ?? null,
      tags: dto.tags ?? [],
      category: dto.category ?? null,
      description: dto.description ?? null,
    }

    const existing = await this.prisma.secret.findFirst({ where: { userId, key: dto.key, username } })
    if (existing && !existing.deletedAt) {
      throw new ConflictException(`A secret ${describeIdentity(dto.key, username)} already exists`)
    }

    try {
      const secret = existing
        ? await this.prisma.secret.update({ where: { id: existing.id }, data: { ...data, deletedAt: null } })
        : await this.prisma.secret.create({ data: { ...data, key: dto.key, username, userId } })

      await this.auditService.log(userId, 'CREATE', 'secret', secret.id, { key: secret.key })
      return { ...secret, value: MASK }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`A secret ${describeIdentity(dto.key, username)} already exists`)
      }
      throw error
    }
  }

  async update(id: string, userId: string, dto: UpdateSecretDto) {
    const current = await this.findOne(id, userId)

    try {
      // A deleted row holds no value, only the name of its key; it must not stop another secret from taking the identity.
      if (dto.username !== undefined && dto.username !== current.username) {
        await this.prisma.secret.deleteMany({ where: { userId, key: current.key, username: dto.username, deletedAt: { not: null } } })
      }

      const secret = await this.prisma.secret.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.value !== undefined && { value: encrypt(dto.value) }),
          ...(dto.username !== undefined && { username: dto.username }),
          ...(dto.url !== undefined && { url: dto.url }),
          ...(dto.tags !== undefined && { tags: dto.tags }),
          ...(dto.category !== undefined && { category: dto.category }),
          ...(dto.description !== undefined && { description: dto.description }),
        },
      })

      await this.auditService.log(userId, 'UPDATE', 'secret', id, { key: secret.key })

      return { ...secret, value: MASK }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`A secret ${describeIdentity(current.key, dto.username ?? current.username)} already exists`)
      }
      throw error
    }
  }

  // Soft delete keeps the audit trail; the encrypted value itself is wiped.
  async remove(id: string, userId: string) {
    const secret = await this.findOne(id, userId)
    await this.prisma.secret.update({
      where: { id },
      data: { deletedAt: new Date(), value: '' },
    })
    await this.auditService.log(userId, 'DELETE', 'secret', id, { key: secret.key })
  }

  async exportBackup(userId: string, passphrase: string, session: AuthenticatedSession | null): Promise<BackupFile> {
    this.assertRecentSignIn(session)
    const secrets = await this.prisma.secret.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    })
    const backup = sealBackup(
      secrets.map((s) => ({
        name: s.name,
        key: s.key,
        username: s.username,
        url: s.url,
        tags: s.tags,
        value: decrypt(s.value),
        category: s.category,
        description: s.description,
      })),
      passphrase,
    )
    await this.auditService.log(userId, 'EXPORT_SECRETS', 'secret', undefined, { count: secrets.length })
    return backup
  }

  // Existing secrets win: a restore never overwrites a secret that is currently in the vault.
  async restoreBackup(userId: string, passphrase: string, file: unknown, session: AuthenticatedSession | null): Promise<RestoreResult> {
    this.assertRecentSignIn(session)
    const result = await this.writeSecrets(userId, openBackup(file, passphrase), false)
    await this.auditService.log(userId, 'IMPORT_SECRETS', 'secret', undefined, { ...result, source: 'backup' })
    return result
  }

  // Rows read from a password manager export. Same rule as a restore: nothing in the vault is overwritten.
  // With dryRun the counts are returned and nothing is written or audited. Values are never logged.
  async importMany(userId: string, dto: ImportSecretsDto): Promise<ImportResult> {
    const dryRun = dto.dryRun === true
    const secrets: BackupSecret[] = dto.items.map((item) => ({
      name: item.name,
      key: item.key,
      username: item.username ?? '',
      url: item.url ?? null,
      tags: [],
      value: item.value,
      category: item.category ?? 'password',
      description: item.description ?? null,
    }))

    const result = await this.writeSecrets(userId, secrets, dryRun)
    if (!dryRun) await this.auditService.log(userId, 'IMPORT_SECRETS', 'secret', undefined, { ...result, source: 'csv' })
    return { ...result, dryRun }
  }

  private async writeSecrets(userId: string, secrets: BackupSecret[], dryRun: boolean): Promise<RestoreResult> {
    const result: RestoreResult = { created: 0, restored: 0, skipped: 0 }

    await this.prisma.$transaction(async (tx) => {
      const rows = await tx.secret.findMany({ where: { userId, key: { in: [...new Set(secrets.map((s) => s.key))] } } })
      const byIdentity = new Map(rows.map((row) => [identityOf(row.key, row.username), row]))
      // An identity repeated inside the input is written once.
      const seen = new Set<string>()
      const toCreate: Prisma.SecretCreateManyInput[] = []

      for (const s of secrets) {
        const identity = identityOf(s.key, s.username)
        const row = byIdentity.get(identity)
        const data = { name: s.name, value: encrypt(s.value), url: s.url, tags: s.tags, category: s.category, description: s.description }

        if (seen.has(identity) || (row && !row.deletedAt)) {
          result.skipped++
        } else if (row) {
          if (!dryRun) await tx.secret.update({ where: { id: row.id }, data: { ...data, deletedAt: null } })
          result.restored++
        } else {
          toCreate.push({ ...data, key: s.key, username: s.username, userId })
          result.created++
        }
        seen.add(identity)
      }

      if (!dryRun && toCreate.length > 0) await tx.secret.createMany({ data: toCreate })
    }, BULK_TRANSACTION)

    return result
  }
}

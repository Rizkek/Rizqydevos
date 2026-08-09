import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { AuditService } from '../../shared/services/audit.service'
import { CreateSecretDto, UpdateSecretDto } from './dto/secret.dto'
import { encrypt, decrypt } from '../../shared/utils/encryption.util'

const MASK = '••••••••'

@Injectable()
export class SecretService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(userId: string) {
    const secrets = await this.prisma.secret.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
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

  async reveal(id: string, userId: string) {
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

  async create(userId: string, dto: CreateSecretDto) {
    // Enforce unique key per user
    const existing = await this.prisma.secret.findFirst({
      where: { userId, key: dto.key, deletedAt: null },
    })
    if (existing) throw new ConflictException(`A secret with key "${dto.key}" already exists`)

    const secret = await this.prisma.secret.create({
      data: {
        name: dto.name,
        key: dto.key,
        value: encrypt(dto.value),
        category: dto.category ?? null,
        description: dto.description ?? null,
        userId,
      },
    })

    await this.auditService.log(userId, 'CREATE', 'secret', secret.id, { key: secret.key })

    return { ...secret, value: MASK }
  }

  async update(id: string, userId: string, dto: UpdateSecretDto) {
    await this.findOne(id, userId)

    const secret = await this.prisma.secret.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.value !== undefined && { value: encrypt(dto.value) }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    })

    await this.auditService.log(userId, 'UPDATE', 'secret', id, { key: secret.key })

    return { ...secret, value: MASK }
  }

  async remove(id: string, userId: string) {
    const secret = await this.findOne(id, userId)
    await this.prisma.secret.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    await this.auditService.log(userId, 'DELETE', 'secret', id, { key: (secret as any).key })
  }
}

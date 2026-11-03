import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SecretService, REAUTH_WINDOW_MS } from './secret.service'
import { sealBackup } from './backup-crypto'
import { decrypt, encrypt } from '../../shared/utils/encryption.util'
import type { PrismaService } from '../../database/prisma.service'
import type { AuditService } from '../../shared/services/audit.service'

process.env.ENCRYPTION_KEY = 'k'.repeat(32)

const PASSPHRASE = 'correct horse battery'
const fresh = () => ({ id: 's1', createdAt: new Date().toISOString() })
const stale = () => ({ id: 's1', createdAt: new Date(Date.now() - REAUTH_WINDOW_MS - 1000).toISOString() })

function makeService() {
  const secret = {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'new', ...data })),
    update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, key: 'k', ...data })),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  }
  const prisma = { secret, $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn({ secret })) }
  const audit = { log: vi.fn() }
  const service = new SecretService(prisma as unknown as PrismaService, audit as unknown as AuditService)
  return { service, secret, audit }
}

describe('SecretService', () => {
  let ctx: ReturnType<typeof makeService>
  beforeEach(() => {
    ctx = makeService()
  })

  describe('ownership', () => {
    it('answers 404 for a secret of another user', async () => {
      await expect(ctx.service.findOne('secret1', 'user1')).rejects.toThrow(NotFoundException)
      expect(ctx.secret.findFirst).toHaveBeenCalledWith({ where: { id: 'secret1', userId: 'user1', deletedAt: null } })
    })

    it('never returns the stored value from findOne', async () => {
      ctx.secret.findFirst.mockResolvedValue({ id: 'secret1', key: 'K', value: encrypt('hidden') })
      const res = await ctx.service.findOne('secret1', 'user1')
      expect(res.value).not.toContain('hidden')
      expect(res.value).not.toContain(':')
    })
  })

  describe('reveal', () => {
    it('requires a sign-in within the last 15 minutes', async () => {
      ctx.secret.findFirst.mockResolvedValue({ id: 'x', key: 'K', name: 'n', value: encrypt('v') })
      await expect(ctx.service.reveal('x', 'u', stale())).rejects.toBeInstanceOf(ForbiddenException)
      await expect(ctx.service.reveal('x', 'u', null)).rejects.toMatchObject({ response: { error: 'REAUTH_REQUIRED' } })
      expect(ctx.audit.log).not.toHaveBeenCalled()
    })

    it('decrypts and writes the reveal to the audit log for a recent sign-in', async () => {
      ctx.secret.findFirst.mockResolvedValue({ id: 'x', key: 'K', name: 'n', value: encrypt('plain value') })
      await expect(ctx.service.reveal('x', 'u', fresh())).resolves.toMatchObject({ value: 'plain value' })
      expect(ctx.audit.log).toHaveBeenCalledWith('u', 'REVEAL_SECRET', 'secret', 'x', { key: 'K', name: 'n' })
    })
  })

  describe('create and delete', () => {
    it('refuses an identity that is in the vault', async () => {
      ctx.secret.findFirst.mockResolvedValue({ id: 'old', key: 'API', username: '', deletedAt: null })
      await expect(ctx.service.create('u', { name: 'n', key: 'API', value: 'v' })).rejects.toBeInstanceOf(ConflictException)
    })

    it('looks for a clash on key and username together, so one site can hold several logins', async () => {
      await ctx.service.create('u', { name: 'Work', key: 'example.com', username: 'ada', value: 'v' })
      expect(ctx.secret.findFirst).toHaveBeenCalledWith({ where: { userId: 'u', key: 'example.com', username: 'ada' } })
      expect(ctx.secret.create.mock.calls[0]![0].data).toMatchObject({ key: 'example.com', username: 'ada', userId: 'u' })
    })

    it('stores no username for an API key and says which account clashed otherwise', async () => {
      await ctx.service.create('u', { name: 'Token', key: 'GITHUB_TOKEN', value: 'v' })
      expect(ctx.secret.create.mock.calls[0]![0].data).toMatchObject({ username: '', tags: [], url: null })

      ctx.secret.findFirst.mockResolvedValue({ id: 'old', key: 'example.com', username: 'ada', deletedAt: null })
      await expect(ctx.service.create('u', { name: 'n', key: 'example.com', username: 'ada', value: 'v' })).rejects.toThrow('"example.com" for ada')
    })

    it('stores the url and tags it was given', async () => {
      await ctx.service.create('u', { name: 'n', key: 'example.com', value: 'v', url: 'https://example.com', tags: ['work'] })
      expect(ctx.secret.create.mock.calls[0]![0].data).toMatchObject({ url: 'https://example.com', tags: ['work'] })
    })

    it('reuses a deleted row with the same identity instead of failing on the unique constraint', async () => {
      ctx.secret.findFirst.mockResolvedValue({ id: 'old', key: 'API', deletedAt: new Date() })
      await ctx.service.create('u', { name: 'New', key: 'API', value: 'fresh' })
      expect(ctx.secret.create).not.toHaveBeenCalled()
      const { where, data } = ctx.secret.update.mock.calls[0]![0]
      expect(where).toEqual({ id: 'old' })
      expect(data).toMatchObject({ name: 'New', deletedAt: null })
      expect(decrypt(data.value)).toBe('fresh')
    })

    it('wipes the encrypted value when a secret is deleted', async () => {
      ctx.secret.findFirst.mockResolvedValue({ id: 'x', key: 'K', value: encrypt('v'), deletedAt: null })
      await ctx.service.remove('x', 'u')
      expect(ctx.secret.update.mock.calls[0]![0].data).toMatchObject({ value: '' })
      expect(ctx.secret.update.mock.calls[0]![0].data.deletedAt).toBeInstanceOf(Date)
    })
  })

  describe('update', () => {
    it('changes the url and tags, and only the fields it was given', async () => {
      ctx.secret.findFirst.mockResolvedValue({ id: 'x', key: 'example.com', username: '', deletedAt: null })
      await ctx.service.update('x', 'u', { url: 'https://example.com', tags: ['a'] })
      expect(ctx.secret.update.mock.calls[0]![0].data).toEqual({ url: 'https://example.com', tags: ['a'] })
    })

    it('frees the identity held by a deleted row before taking a new username', async () => {
      ctx.secret.findFirst.mockResolvedValue({ id: 'x', key: 'example.com', username: '', deletedAt: null })
      await ctx.service.update('x', 'u', { username: 'ada' })
      expect(ctx.secret.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u', key: 'example.com', username: 'ada', deletedAt: { not: null } } })
    })

    it('answers 409 when the new username belongs to another secret in the vault', async () => {
      ctx.secret.findFirst.mockResolvedValue({ id: 'x', key: 'example.com', username: '', deletedAt: null })
      ctx.secret.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' }))
      await expect(ctx.service.update('x', 'u', { username: 'ada' })).rejects.toBeInstanceOf(ConflictException)
    })
  })

  describe('backup', () => {
    it('exports decrypted values sealed with the passphrase, and only for a recent sign-in', async () => {
      ctx.secret.findMany.mockResolvedValue([{ name: 'n', key: 'K', username: 'ada', url: null, tags: [], value: encrypt('v1'), category: null, description: null }])
      await expect(ctx.service.exportBackup('u', PASSPHRASE, stale())).rejects.toBeInstanceOf(ForbiddenException)

      const backup = await ctx.service.exportBackup('u', PASSPHRASE, fresh())
      expect(JSON.stringify(backup)).not.toContain('v1')
      expect(ctx.audit.log).toHaveBeenCalledWith('u', 'EXPORT_SECRETS', 'secret', undefined, { count: 1 })
    })

    it('keeps username, url, and tags through an export and a restore', async () => {
      ctx.secret.findMany.mockResolvedValueOnce([
        { name: 'Work', key: 'example.com', username: 'ada', url: 'https://example.com', tags: ['work'], value: encrypt('pw'), category: 'password', description: null },
      ])
      const backup = await ctx.service.exportBackup('u', PASSPHRASE, fresh())

      ctx.secret.findMany.mockResolvedValueOnce([])
      await ctx.service.restoreBackup('u', PASSPHRASE, backup, fresh())
      expect(ctx.secret.createMany.mock.calls[0]![0].data[0]).toMatchObject({ key: 'example.com', username: 'ada', url: 'https://example.com', tags: ['work'], userId: 'u' })
    })

    it('restores new identities, revives deleted ones, and never overwrites a secret in the vault', async () => {
      const base = { username: '', url: null, tags: [] as string[], description: null }
      const backup = sealBackup([
        { ...base, name: 'A', key: 'NEW', value: 'a', category: null },
        { ...base, name: 'B', key: 'DELETED', value: 'b', category: 'api-key' },
        { ...base, name: 'C', key: 'ACTIVE', value: 'c', category: null },
        { ...base, name: 'A again', key: 'NEW', value: 'a2', category: null },
        { ...base, name: 'A other account', key: 'NEW', username: 'ada', value: 'a3', category: null },
      ], PASSPHRASE)
      ctx.secret.findMany.mockResolvedValue([
        { id: 'd', key: 'DELETED', username: '', deletedAt: new Date() },
        { id: 'a', key: 'ACTIVE', username: '', deletedAt: null },
      ])

      const result = await ctx.service.restoreBackup('u', PASSPHRASE, backup, fresh())

      expect(result).toEqual({ created: 2, restored: 1, skipped: 2 })
      const created = ctx.secret.createMany.mock.calls[0]![0].data
      expect(created.map((row: { key: string; username: string }) => `${row.key}/${row.username}`)).toEqual(['NEW/', 'NEW/ada'])
      expect(decrypt(created[0].value)).toBe('a')
      expect(ctx.secret.update.mock.calls[0]![0]).toMatchObject({ where: { id: 'd' }, data: { deletedAt: null, category: 'api-key' } })
    })

    it('rejects a wrong passphrase without writing anything', async () => {
      const backup = sealBackup([{ name: 'A', key: 'K', username: '', url: null, tags: [], value: 'a', category: null, description: null }], PASSPHRASE)
      await expect(ctx.service.restoreBackup('u', 'wrong passphrase!', backup, fresh())).rejects.toMatchObject({ response: { error: 'INVALID_BACKUP' } })
      expect(ctx.secret.createMany).not.toHaveBeenCalled()
      expect(ctx.secret.update).not.toHaveBeenCalled()
    })
  })

  describe('import from a password manager', () => {
    const items = [
      { name: 'example.com', key: 'example.com', username: 'ada', url: 'https://example.com/login', value: 'pw-1' },
      { name: 'example.com', key: 'example.com', username: 'bob', url: 'https://example.com/login', value: 'pw-2' },
      { name: 'old.example', key: 'old.example', username: 'ada', value: 'pw-3' },
      { name: 'kept.example', key: 'kept.example', username: 'ada', value: 'pw-4' },
      { name: 'example.com', key: 'example.com', username: 'ada', value: 'pw-1-again' },
    ]

    beforeEach(() => {
      ctx.secret.findMany.mockResolvedValue([
        { id: 'd', key: 'old.example', username: 'ada', deletedAt: new Date() },
        { id: 'k', key: 'kept.example', username: 'ada', deletedAt: null },
      ])
    })

    it('counts what would happen without writing or auditing anything when dryRun is on', async () => {
      const result = await ctx.service.importMany('u', { items, dryRun: true })
      expect(result).toEqual({ created: 2, restored: 1, skipped: 2, dryRun: true })
      expect(ctx.secret.createMany).not.toHaveBeenCalled()
      expect(ctx.secret.update).not.toHaveBeenCalled()
      expect(ctx.audit.log).not.toHaveBeenCalled()
    })

    it('writes the rows as encrypted passwords and records only counts in the audit log', async () => {
      const result = await ctx.service.importMany('u', { items })
      expect(result).toEqual({ created: 2, restored: 1, skipped: 2, dryRun: false })

      const created = ctx.secret.createMany.mock.calls[0]![0].data
      expect(created).toHaveLength(2)
      expect(created[0]).toMatchObject({ key: 'example.com', username: 'ada', url: 'https://example.com/login', category: 'password', userId: 'u' })
      expect(decrypt(created[0].value)).toBe('pw-1')
      expect(created[0].value).not.toContain('pw-1')

      expect(ctx.audit.log).toHaveBeenCalledWith('u', 'IMPORT_SECRETS', 'secret', undefined, { created: 2, restored: 1, skipped: 2, source: 'csv' })
      expect(JSON.stringify(ctx.audit.log.mock.calls)).not.toMatch(/pw-\d/)
    })

    it('does not overwrite a secret that is already in the vault', async () => {
      await ctx.service.importMany('u', { items })
      const touched = ctx.secret.update.mock.calls.map((call) => call[0].where.id)
      expect(touched).toEqual(['d'])
    })
  })

})

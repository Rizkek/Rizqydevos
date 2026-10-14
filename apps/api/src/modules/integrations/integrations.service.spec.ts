import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { decrypt, encrypt } from '../../shared/utils/encryption.util'
import { IntegrationException } from './integration.errors'
import { IntegrationProvider } from './integration-provider'
import { IntegrationsService } from './integrations.service'

const KEY_A = 'a'.repeat(32)
const KEY_B = 'b'.repeat(32)

async function caught(promise: Promise<unknown>): Promise<IntegrationException> {
  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(IntegrationException)
    return error as IntegrationException
  }
  throw new Error('expected the promise to reject')
}

describe('IntegrationsService', () => {
  const originalKey = process.env.ENCRYPTION_KEY
  let prisma: {
    integration: Record<'upsert' | 'findMany' | 'findUnique' | 'findUniqueOrThrow' | 'updateMany' | 'deleteMany', ReturnType<typeof vi.fn>>
  }
  let service: IntegrationsService

  beforeAll(() => {
    process.env.ENCRYPTION_KEY = KEY_A
  })

  afterAll(() => {
    if (originalKey === undefined) delete process.env.ENCRYPTION_KEY
    else process.env.ENCRYPTION_KEY = originalKey
  })

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = KEY_A
    prisma = {
      integration: {
        upsert: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        updateMany: vi.fn(),
        deleteMany: vi.fn(),
      },
    }
    service = new IntegrationsService(prisma as never)
  })

  describe('upsert', () => {
    it('stores only the encrypted token and re-enables on reconnect', async () => {
      prisma.integration.upsert.mockResolvedValue({ id: 'i1', provider: 'github', enabled: true, metadata: { accountLogin: 'octo' }, updatedAt: new Date() })

      await service.upsert('u1', IntegrationProvider.Github, 'plain-token', { accountLogin: 'octo' })

      const args = prisma.integration.upsert.mock.calls[0]![0]
      expect(args.create.accessToken).not.toContain('plain-token')
      expect(decrypt(args.create.accessToken)).toBe('plain-token')
      expect(decrypt(args.update.accessToken)).toBe('plain-token')
      expect(args.update.enabled).toBe(true)
      expect(args.where).toEqual({ userId_provider: { userId: 'u1', provider: 'github' } })
    })

    it('never selects token columns in the returned summary', async () => {
      prisma.integration.upsert.mockResolvedValue({ id: 'i1', provider: 'vercel', enabled: true, metadata: {}, updatedAt: new Date() })
      await service.upsert('u1', IntegrationProvider.Vercel, 't', {})
      const { select } = prisma.integration.upsert.mock.calls[0]![0]
      expect(select.accessToken).toBeUndefined()
      expect(select.refreshToken).toBeUndefined()
    })
  })

  describe('list', () => {
    it('selects no token columns and keeps only known metadata keys', async () => {
      prisma.integration.findMany.mockResolvedValue([
        { id: 'i1', provider: 'vercel', enabled: false, metadata: { accountLogin: 'octo', teamId: 'team_1', stray: 'x' }, updatedAt: new Date() },
        { id: 'i2', provider: 'github', enabled: true, metadata: null, updatedAt: new Date() },
      ])

      const result = await service.list('u1')

      const { select } = prisma.integration.findMany.mock.calls[0]![0]
      expect(select.accessToken).toBeUndefined()
      expect(select.refreshToken).toBeUndefined()
      expect(result[0]!.metadata).toEqual({ accountLogin: 'octo', teamId: 'team_1' })
      expect(result[1]!.metadata).toEqual({})
      expect(result[0]!.enabled).toBe(false)
    })
  })

  describe('getCredentials', () => {
    it('throws INTEGRATION_NOT_CONFIGURED when no row exists or the row has no token', async () => {
      prisma.integration.findUnique.mockResolvedValueOnce(null)
      expect((await caught(service.getCredentials('u1', IntegrationProvider.Github))).code).toBe('INTEGRATION_NOT_CONFIGURED')

      prisma.integration.findUnique.mockResolvedValueOnce({ accessToken: null, enabled: true, metadata: {} })
      expect((await caught(service.getCredentials('u1', IntegrationProvider.Github))).code).toBe('INTEGRATION_NOT_CONFIGURED')
    })

    it('throws INTEGRATION_DISABLED, distinct from not configured', async () => {
      prisma.integration.findUnique.mockResolvedValue({ accessToken: encrypt('t'), enabled: false, metadata: {} })
      expect((await caught(service.getCredentials('u1', IntegrationProvider.Github))).code).toBe('INTEGRATION_DISABLED')
    })

    it('returns the decrypted token and metadata', async () => {
      prisma.integration.findUnique.mockResolvedValue({ accessToken: encrypt('secret-token'), enabled: true, metadata: { accountLogin: 'octo' } })
      await expect(service.getCredentials('u1', IntegrationProvider.Github)).resolves.toEqual({
        token: 'secret-token',
        metadata: { accountLogin: 'octo' },
      })
    })

    it('throws TOKEN_UNREADABLE when the encryption key changed', async () => {
      const stored = encrypt('secret-token')
      process.env.ENCRYPTION_KEY = KEY_B
      prisma.integration.findUnique.mockResolvedValue({ accessToken: stored, enabled: true, metadata: {} })
      const error = await caught(service.getCredentials('u1', IntegrationProvider.Github))
      expect(error.code).toBe('TOKEN_UNREADABLE')
      expect(error.getStatus()).toBe(409)
    })

    it('throws TOKEN_UNREADABLE for a corrupted value', async () => {
      prisma.integration.findUnique.mockResolvedValue({ accessToken: 'aa:bb:cc', enabled: true, metadata: {} })
      expect((await caught(service.getCredentials('u1', IntegrationProvider.Github))).code).toBe('TOKEN_UNREADABLE')
    })
  })

  describe('setEnabled', () => {
    it('throws INTEGRATION_NOT_CONFIGURED when nothing matched', async () => {
      prisma.integration.updateMany.mockResolvedValue({ count: 0 })
      expect((await caught(service.setEnabled('u1', IntegrationProvider.Github, false))).code).toBe('INTEGRATION_NOT_CONFIGURED')
      expect(prisma.integration.findUniqueOrThrow).not.toHaveBeenCalled()
    })

    it('updates and returns the summary', async () => {
      prisma.integration.updateMany.mockResolvedValue({ count: 1 })
      prisma.integration.findUniqueOrThrow.mockResolvedValue({ id: 'i1', provider: 'github', enabled: false, metadata: {}, updatedAt: new Date() })
      const result = await service.setEnabled('u1', IntegrationProvider.Github, false)
      expect(prisma.integration.updateMany).toHaveBeenCalledWith({ where: { userId: 'u1', provider: 'github' }, data: { enabled: false } })
      expect(result.enabled).toBe(false)
    })
  })

  describe('remove', () => {
    it('is idempotent: removing a missing integration does not throw', async () => {
      prisma.integration.deleteMany.mockResolvedValue({ count: 0 })
      await expect(service.remove('u1', IntegrationProvider.Github)).resolves.toBe(false)
    })

    it('reports when something was removed', async () => {
      prisma.integration.deleteMany.mockResolvedValue({ count: 1 })
      await expect(service.remove('u1', IntegrationProvider.Github)).resolves.toBe(true)
    })
  })
})

import { BadRequestException, HttpStatus } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IntegrationConnectionService } from './integration-connection.service'
import { IntegrationException } from './integration.errors'
import { IntegrationProvider } from './integration-provider'

const summary = { id: 'i1', provider: 'github', enabled: true, metadata: { accountLogin: 'octo' }, updatedAt: new Date() }

describe('IntegrationConnectionService', () => {
  const calls: string[] = []
  let integrations: { upsert: ReturnType<typeof vi.fn>; setEnabled: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> }
  let github: { verifyToken: ReturnType<typeof vi.fn> }
  let vercel: { verifyToken: ReturnType<typeof vi.fn> }
  let audit: { log: ReturnType<typeof vi.fn> }
  let service: IntegrationConnectionService

  beforeEach(() => {
    calls.length = 0
    integrations = {
      upsert: vi.fn().mockImplementation(async () => (calls.push('upsert'), summary)),
      setEnabled: vi.fn().mockResolvedValue({ ...summary, enabled: false }),
      remove: vi.fn().mockResolvedValue(true),
    }
    github = { verifyToken: vi.fn().mockImplementation(async () => (calls.push('verify'), { accountLogin: 'octo' })) }
    vercel = { verifyToken: vi.fn().mockResolvedValue({ accountLogin: 'octo', teamId: 'team_1' }) }
    audit = { log: vi.fn().mockResolvedValue(undefined) }
    service = new IntegrationConnectionService(integrations as never, github as never, vercel as never, audit as never)
  })

  describe('connect', () => {
    it('verifies the token before saving and saves the verified account', async () => {
      await service.connect('u1', IntegrationProvider.Github, { accessToken: 'tok' })
      expect(calls).toEqual(['verify', 'upsert'])
      expect(integrations.upsert).toHaveBeenCalledWith('u1', IntegrationProvider.Github, 'tok', { accountLogin: 'octo' })
    })

    it('rejects a refused token with 422 INTEGRATION_TOKEN_INVALID and saves nothing', async () => {
      github.verifyToken.mockRejectedValue(new IntegrationException(HttpStatus.FAILED_DEPENDENCY, 'TOKEN_REJECTED', 'x'))

      let error: unknown
      try {
        await service.connect('u1', IntegrationProvider.Github, { accessToken: 'bad' })
      } catch (e) {
        error = e
      }

      expect(error).toBeInstanceOf(IntegrationException)
      expect((error as IntegrationException).code).toBe('INTEGRATION_TOKEN_INVALID')
      expect((error as IntegrationException).getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY)
      expect(integrations.upsert).not.toHaveBeenCalled()
      expect(audit.log).not.toHaveBeenCalled()
    })

    it.each([
      ['RATE_LIMITED', HttpStatus.TOO_MANY_REQUESTS],
      ['UPSTREAM_UNAVAILABLE', HttpStatus.BAD_GATEWAY],
    ] as const)('passes %s through unchanged and saves nothing', async (code, status) => {
      github.verifyToken.mockRejectedValue(new IntegrationException(status, code, 'x'))
      await expect(service.connect('u1', IntegrationProvider.Github, { accessToken: 'tok' })).rejects.toMatchObject({ code })
      expect(integrations.upsert).not.toHaveBeenCalled()
    })

    it('passes the team id to Vercel verification', async () => {
      await service.connect('u1', IntegrationProvider.Vercel, { accessToken: 'tok', teamId: 'team_1' })
      expect(vercel.verifyToken).toHaveBeenCalledWith('tok', 'team_1')
      expect(integrations.upsert).toHaveBeenCalledWith('u1', IntegrationProvider.Vercel, 'tok', { accountLogin: 'octo', teamId: 'team_1' })
    })

    it('refuses a team id for GitHub before any network call', async () => {
      await expect(service.connect('u1', IntegrationProvider.Github, { accessToken: 'tok', teamId: 'team_1' })).rejects.toBeInstanceOf(BadRequestException)
      expect(github.verifyToken).not.toHaveBeenCalled()
    })

    it('audits the connection without writing the token', async () => {
      await service.connect('u1', IntegrationProvider.Github, { accessToken: 'super-secret-token' })
      expect(audit.log).toHaveBeenCalledWith('u1', 'CREATE', 'integration', 'i1', { provider: 'github', accountLogin: 'octo' })
      expect(JSON.stringify(audit.log.mock.calls)).not.toContain('super-secret-token')
    })
  })

  describe('setEnabled', () => {
    it('updates and audits', async () => {
      const result = await service.setEnabled('u1', IntegrationProvider.Github, false)
      expect(result.enabled).toBe(false)
      expect(audit.log).toHaveBeenCalledWith('u1', 'UPDATE', 'integration', 'i1', { provider: 'github', enabled: false })
    })
  })

  describe('disconnect', () => {
    it('audits only when something was removed', async () => {
      await service.disconnect('u1', IntegrationProvider.Github)
      expect(audit.log).toHaveBeenCalledWith('u1', 'DELETE', 'integration', undefined, { provider: 'github' })

      audit.log.mockClear()
      integrations.remove.mockResolvedValue(false)
      await expect(service.disconnect('u1', IntegrationProvider.Github)).resolves.toBeUndefined()
      expect(audit.log).not.toHaveBeenCalled()
    })
  })
})

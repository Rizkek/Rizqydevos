import { Test, TestingModule } from '@nestjs/testing'
import { VercelService } from './vercel.service'
import { IntegrationsService } from './integrations.service'
import { UnauthorizedException } from '@nestjs/common'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('VercelService', () => {
  let service: VercelService
  let integrationsService: any

  beforeEach(async () => {
    integrationsService = {
      getDecryptedToken: vi.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VercelService,
        { provide: IntegrationsService, useValue: integrationsService },
      ],
    }).compile()

    service = module.get<VercelService>(VercelService)
  })

  it('should throw UnauthorizedException if token is missing', async () => {
    integrationsService.getDecryptedToken.mockResolvedValue(null)
    await expect(service.getDeployments('user1')).rejects.toThrow(UnauthorizedException)
  })

  it('should map fetch errors (e.g. 401) to UnauthorizedException', async () => {
    integrationsService.getDecryptedToken.mockResolvedValue('mock-token')
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    })

    await expect(service.getDeployments('user1')).rejects.toThrow(UnauthorizedException)
  })

  it('should return deployments on success', async () => {
    integrationsService.getDecryptedToken.mockResolvedValue('mock-token')
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        deployments: [
          { uid: 'd1', name: 'app', url: 'app.vercel.app', state: 'READY', created: 123, target: 'production' }
        ]
      })
    })

    const res = await service.getDeployments('user1')
    expect(res).toHaveLength(1)
    expect(res[0].id).toBe('d1')
  })
})
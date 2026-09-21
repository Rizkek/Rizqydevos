import { Test, TestingModule } from '@nestjs/testing'
import { DockerService } from './docker.service'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BadRequestException } from '@nestjs/common'
import * as childProcess from 'child_process'

// Mock child_process execFile
vi.mock('child_process', () => ({
  execFile: vi.fn((cmd, args, opts, callback) => callback(null, 'mock stdout', ''))
}))

describe('DockerService', () => {
  let service: DockerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DockerService],
    }).compile()

    service = module.get<DockerService>(DockerService)
    vi.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('performAction / host-control boundaries', () => {
    it('should reject invalid docker ID', async () => {
      // Missing characters, semicolons, injection attempts
      await expect(service.performAction('invalid; id', 'start')).rejects.toThrow(BadRequestException)
      await expect(service.performAction('rm -rf /', 'stop')).rejects.toThrow(BadRequestException)
      await expect(service.performAction('short', 'restart')).rejects.toThrow(BadRequestException)

      expect(childProcess.execFile).not.toHaveBeenCalled()
    })

    it('should allow valid hexadecimal docker IDs', async () => {
      const validId = 'a1b2c3d4e5f60123456789abcdef'
      const res = await service.performAction(validId, 'start')
      expect(res).toEqual({ success: true })
      
      expect(childProcess.execFile).toHaveBeenCalledWith(
        'docker',
        ['start', validId],
        expect.any(Object),
        expect.any(Function)
      )
    })
  })
})
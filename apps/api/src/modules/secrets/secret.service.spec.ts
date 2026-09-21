import { Test, TestingModule } from '@nestjs/testing'
import { SecretService } from './secret.service'
import { PrismaService } from '../../database/prisma.service'
import { AuditService } from '../../shared/services/audit.service'
import { NotFoundException } from '@nestjs/common'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as crypto from 'crypto'

describe('SecretService', () => {
  let service: SecretService
  let prisma: any
  let audit: any

  const mockEncryptionKey = crypto.randomBytes(32).toString('utf-8')
  process.env.ENCRYPTION_KEY = mockEncryptionKey

  beforeEach(async () => {
    prisma = {
      secret: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      }
    }
    audit = {
      log: vi.fn()
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecretService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile()

    service = module.get<SecretService>(SecretService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('findOne / ownership', () => {
    it('should throw NotFoundException if secret is not owned by user', async () => {
      prisma.secret.findFirst.mockResolvedValue(null)
      
      await expect(service.findOne('secret1', 'user1')).rejects.toThrow(NotFoundException)
      expect(prisma.secret.findFirst).toHaveBeenCalledWith({
        where: { id: 'secret1', userId: 'user1', deletedAt: null },
      })
    })

    it('should return secret (without decrypted value) if owned by user', async () => {
      prisma.secret.findFirst.mockResolvedValue({ id: 'secret1', userId: 'user1', encryptedValue: 'abc', iv: 'def' })
      
      const res = await service.findOne('secret1', 'user1')
      expect(res.id).toBe('secret1')
    })
  })
})
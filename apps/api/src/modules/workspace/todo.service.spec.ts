import { Test, TestingModule } from '@nestjs/testing'
import { TodoService } from './todo.service'
import { PrismaService } from '../../database/prisma.service'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto'

describe('TodoService', () => {
  let service: TodoService
  let prisma: any

  beforeEach(async () => {
    prisma = {
      todo: {
        findMany: vi.fn(),
      }
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodoService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()

    service = module.get<TodoService>(TodoService)
  })

  it('should enforce pagination constraints in findMany', async () => {
    prisma.todo.findMany.mockResolvedValue([])

    const query: PaginationQueryDto = { page: 2, limit: 10 }
    
    await service.findAll('user1', {}, query)
    
    expect(prisma.todo.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 10,
      take: 10,
      where: expect.objectContaining({ userId: 'user1' })
    }))
  })
})
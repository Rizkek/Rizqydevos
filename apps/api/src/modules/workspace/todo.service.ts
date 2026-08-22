import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateTodoDto } from './dto/create-todo.dto'
import { UpdateTodoDto } from './dto/update-todo.dto'
import { Prisma } from '@prisma/client'

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    filters: { completed?: boolean; priority?: string },
  ) {
    const where: Prisma.TodoWhereInput = {
      userId,
      deletedAt: null,
    }

    if (filters.completed !== undefined) {
      where.completed = filters.completed
    }

    if (filters.priority) {
      where.priority = filters.priority as Prisma.EnumPriorityFilter
    }

    return this.prisma.todo.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    })
  }

  async findOne(id: string, userId: string) {
    const todo = await this.prisma.todo.findFirst({
      where: { id, userId, deletedAt: null },
    })

    if (!todo) {
      throw new NotFoundException(`Todo ${id} not found`)
    }

    return todo
  }

  async create(userId: string, dto: CreateTodoDto) {
    return this.prisma.todo.create({
      data: {
        title: dto.title,
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
        tags: dto.tags ?? [],
        userId,
      },
    })
  }

  async update(id: string, userId: string, dto: UpdateTodoDto) {
    await this.findOne(id, userId)

    return this.prisma.todo.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.completed !== undefined && { completed: dto.completed }),
        ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      },
    })
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId)

    // Soft delete
    return this.prisma.todo.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}

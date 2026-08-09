import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateSnippetDto } from './dto/create-snippet.dto'
import { UpdateSnippetDto } from './dto/update-snippet.dto'

@Injectable()
export class SnippetService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filters: { language?: string; pinned?: boolean }) {
    return this.prisma.snippet.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(filters.language && { language: filters.language }),
        ...(filters.pinned !== undefined && { pinned: filters.pinned }),
      },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    })
  }

  async findOne(id: string, userId: string) {
    const snippet = await this.prisma.snippet.findFirst({
      where: { id, userId, deletedAt: null },
    })

    if (!snippet) {
      throw new NotFoundException(`Snippet ${id} not found`)
    }

    return snippet
  }

  async create(userId: string, dto: CreateSnippetDto) {
    return this.prisma.snippet.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        content: dto.content,
        language: dto.language,
        tags: dto.tags ?? [],
        pinned: dto.pinned ?? false,
        userId,
      },
    })
  }

  async update(id: string, userId: string, dto: UpdateSnippetDto) {
    await this.findOne(id, userId)

    return this.prisma.snippet.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.language !== undefined && { language: dto.language }),
        ...(dto.pinned !== undefined && { pinned: dto.pinned }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      },
    })
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId)

    return this.prisma.snippet.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}

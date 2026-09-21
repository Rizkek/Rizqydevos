import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreatePromptDto } from './dto/create-prompt.dto'
import { UpdatePromptDto } from './dto/update-prompt.dto'

@Injectable()
export class PromptsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    query: import('../../shared/dto/pagination-query.dto').PaginationQueryDto,
  ) {
    return this.prisma.aiPrompt.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: [
        { pinned: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    })
  }

  async findOne(id: string, userId: string) {
    const prompt = await this.prisma.aiPrompt.findFirst({
      where: { id, userId, deletedAt: null },
    })

    if (!prompt) {
      throw new NotFoundException(`Prompt ${id} not found`)
    }

    return prompt
  }

  async create(userId: string, dto: CreatePromptDto) {
    // Note: Prisma JSON types require explicit typing or we can just pass the record if it matches.
    // The dto variables is Record<string, any>, which Prisma accepts for Json inputs.
    return this.prisma.aiPrompt.create({
      data: {
        title: dto.title,
        content: dto.content,
        ...(dto.category !== undefined && { category: dto.category }),
        tags: dto.tags ?? [],
        ...(dto.variables !== undefined && { variables: dto.variables }),
        ...(dto.pinned !== undefined && { pinned: dto.pinned }),
        userId,
      },
    })
  }

  async update(id: string, userId: string, dto: UpdatePromptDto) {
    await this.findOne(id, userId)

    return this.prisma.aiPrompt.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.variables !== undefined && { variables: dto.variables }),
        ...(dto.pinned !== undefined && { pinned: dto.pinned }),
      },
    })
  }

  async incrementUsage(id: string, userId: string) {
    await this.findOne(id, userId)

    return this.prisma.aiPrompt.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1
        }
      },
    })
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId)

    // Soft delete
    return this.prisma.aiPrompt.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}

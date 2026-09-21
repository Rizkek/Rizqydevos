import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateBookmarkDto } from './dto/create-bookmark.dto'
import { UpdateBookmarkDto } from './dto/update-bookmark.dto'
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto'

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: PaginationQueryDto) {
    return this.prisma.bookmark.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: [
        { pinned: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    })
  }

  async findOne(id: string, userId: string) {
    const bookmark = await this.prisma.bookmark.findFirst({
      where: { id, userId, deletedAt: null },
    })

    if (!bookmark) {
      throw new NotFoundException(`Bookmark ${id} not found`)
    }

    return bookmark
  }

  async create(userId: string, dto: CreateBookmarkDto) {
    return this.prisma.bookmark.create({
      data: {
        title: dto.title,
        url: dto.url,
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.favicon !== undefined && { favicon: dto.favicon }),
        tags: dto.tags ?? [],
        ...(dto.pinned !== undefined && { pinned: dto.pinned }),
        userId,
      },
    })
  }

  async update(id: string, userId: string, dto: UpdateBookmarkDto) {
    await this.findOne(id, userId)

    return this.prisma.bookmark.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.favicon !== undefined && { favicon: dto.favicon }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.pinned !== undefined && { pinned: dto.pinned }),
      },
    })
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId)

    return this.prisma.bookmark.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}

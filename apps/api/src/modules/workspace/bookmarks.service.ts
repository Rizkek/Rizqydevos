import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateBookmarkDto } from './dto/create-bookmark.dto'
import { UpdateBookmarkDto } from './dto/update-bookmark.dto'
import { ImportBookmarksDto } from './dto/import-bookmarks.dto'
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto'
import { normalizeBookmarkUrl } from './bookmark-url'

// One user keeps at most a few thousand links; the Links page searches and filters them in the browser.
export const MAX_LISTED_BOOKMARKS = 5000

export interface ImportResult {
  created: number
  skipped: number
}

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async findEverything(userId: string) {
    return this.prisma.bookmark.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      take: MAX_LISTED_BOOKMARKS,
    })
  }

  // Skips links already saved (or repeated inside the file) so importing the same export twice adds nothing.
  async importMany(userId: string, dto: ImportBookmarksDto): Promise<ImportResult> {
    const existing = await this.prisma.bookmark.findMany({
      where: { userId, deletedAt: null },
      select: { url: true },
    })
    const seen = new Set(existing.map((b) => normalizeBookmarkUrl(b.url)))

    const data = []
    for (const item of dto.items) {
      const key = normalizeBookmarkUrl(item.url)
      if (seen.has(key)) continue
      seen.add(key)
      data.push({
        userId,
        title: item.title,
        url: item.url,
        description: item.description ?? null,
        tags: item.tags ?? [],
        ...(item.createdAt && { createdAt: new Date(item.createdAt) }),
      })
    }

    if (data.length > 0) await this.prisma.bookmark.createMany({ data })
    return { created: data.length, skipped: dto.items.length - data.length }
  }

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

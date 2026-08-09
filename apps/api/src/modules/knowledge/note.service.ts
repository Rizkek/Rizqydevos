import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto'

@Injectable()
export class NoteService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, filters?: { pinned?: boolean }) {
    return this.prisma.note.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(filters?.pinned !== undefined && { pinned: filters.pinned }),
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id, userId, deletedAt: null },
    })

    if (!note) throw new NotFoundException('Note not found')
    return note
  }

  async create(userId: string, dto: CreateNoteDto) {
    return this.prisma.note.create({
      data: {
        title: dto.title,
        content: dto.content,
        tags: dto.tags ?? [],
        pinned: dto.pinned ?? false,
        userId,
      },
    })
  }

  async update(id: string, userId: string, dto: UpdateNoteDto) {
    await this.findOne(id, userId) // check exists

    return this.prisma.note.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.pinned !== undefined && { pinned: dto.pinned }),
      },
    })
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId) // check exists
    return this.prisma.note.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}

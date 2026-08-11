import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateNoteDto } from './dto/create-note.dto'
import { UpdateNoteDto } from './dto/update-note.dto'

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.note.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: [
        { pinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    })
  }

  async findOne(id: string, userId: string) {
    const note = await this.prisma.note.findFirst({
      where: { id, userId, deletedAt: null },
    })

    if (!note) {
      throw new NotFoundException(`Note ${id} not found`)
    }

    return note
  }

  async create(userId: string, dto: CreateNoteDto) {
    return this.prisma.note.create({
      data: {
        title: dto.title,
        content: dto.content,
        tags: dto.tags ?? [],
        ...(dto.pinned !== undefined && { pinned: dto.pinned }),
        userId,
      },
    })
  }

  async update(id: string, userId: string, dto: UpdateNoteDto) {
    await this.findOne(id, userId)

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
    await this.findOne(id, userId)

    return this.prisma.note.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }
}

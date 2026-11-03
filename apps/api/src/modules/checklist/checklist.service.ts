import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CHECKLIST_TEMPLATES } from './checklist-templates'
import { AddChecklistTemplatesDto, CreateChecklistItemDto, UpdateChecklistItemDto } from './dto/checklist.dto'

// One user keeps a few projects with a handful of items each; the Security page filters in the browser.
export const MAX_LISTED_ITEMS = 2000
const DAY_MS = 24 * 60 * 60 * 1000

@Injectable()
export class ChecklistService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    const items = await this.prisma.checklistItem.findMany({
      where: { userId, project: { deletedAt: null } },
      include: { project: { select: { name: true } }, secret: { select: { name: true, deletedAt: true } } },
      orderBy: [{ project: { name: 'asc' } }, { createdAt: 'asc' }],
      take: MAX_LISTED_ITEMS,
    })

    return items.map(({ project, secret, ...item }) => ({
      ...item,
      projectName: project.name,
      // A deleted secret is shown as unlinked instead of leaking its name.
      secretName: secret && !secret.deletedAt ? secret.name : null,
    }))
  }

  async create(userId: string, dto: CreateChecklistItemDto) {
    await this.assertProject(userId, dto.projectId)
    if (dto.secretId) await this.assertSecret(userId, dto.secretId)

    return this.prisma.checklistItem.create({
      data: {
        userId,
        projectId: dto.projectId,
        title: dto.title,
        note: dto.note ?? null,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        repeatDays: dto.repeatDays ?? null,
        secretId: dto.secretId ?? null,
      },
    })
  }

  // Adds only the recommended items the project does not have yet, so the button is safe to press twice.
  async addTemplates(userId: string, dto: AddChecklistTemplatesDto) {
    await this.assertProject(userId, dto.projectId)
    const existing = await this.prisma.checklistItem.findMany({
      where: { userId, projectId: dto.projectId },
      select: { title: true },
    })
    const have = new Set(existing.map((item) => item.title))
    const missing = CHECKLIST_TEMPLATES.filter((template) => !have.has(template.title))

    if (missing.length > 0) {
      await this.prisma.checklistItem.createMany({
        data: missing.map((template) => ({ userId, projectId: dto.projectId, title: template.title, repeatDays: template.repeatDays })),
      })
    }
    return { created: missing.length }
  }

  async update(id: string, userId: string, dto: UpdateChecklistItemDto, now = new Date()) {
    const item = await this.prisma.checklistItem.findFirst({ where: { id, userId } })
    if (!item) throw new NotFoundException('Checklist item not found')
    if (dto.secretId) await this.assertSecret(userId, dto.secretId)

    const repeatDays = dto.repeatDays !== undefined ? dto.repeatDays : item.repeatDays
    const data: Record<string, unknown> = {}
    if (dto.title !== undefined) data.title = dto.title
    if (dto.note !== undefined) data.note = dto.note
    if (dto.repeatDays !== undefined) data.repeatDays = dto.repeatDays
    if (dto.secretId !== undefined) data.secretId = dto.secretId
    if (dto.dueAt !== undefined) data.dueAt = dto.dueAt === null ? null : new Date(dto.dueAt)

    if (dto.done === true) {
      data.done = true
      data.doneAt = now
      // Checking an item starts its next interval, unless the request sets the due date itself.
      if (repeatDays && dto.dueAt === undefined) data.dueAt = new Date(now.getTime() + repeatDays * DAY_MS)
    } else if (dto.done === false) {
      data.done = false
      data.doneAt = null
    }

    return this.prisma.checklistItem.update({ where: { id }, data })
  }

  async remove(id: string, userId: string) {
    const item = await this.prisma.checklistItem.findFirst({ where: { id, userId }, select: { id: true } })
    if (!item) throw new NotFoundException('Checklist item not found')
    await this.prisma.checklistItem.delete({ where: { id } })
  }

  private async assertProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({ where: { id: projectId, userId, deletedAt: null }, select: { id: true } })
    if (!project) throw new NotFoundException('Project not found')
  }

  private async assertSecret(userId: string, secretId: string) {
    const secret = await this.prisma.secret.findFirst({ where: { id: secretId, userId, deletedAt: null }, select: { id: true } })
    if (!secret) throw new NotFoundException('Secret not found')
  }
}

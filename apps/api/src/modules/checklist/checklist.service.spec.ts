import { NotFoundException } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { describe, expect, it, vi } from 'vitest'
import { ChecklistService } from './checklist.service'
import { CHECKLIST_TEMPLATES } from './checklist-templates'
import { CreateChecklistItemDto, UpdateChecklistItemDto } from './dto/checklist.dto'
import type { PrismaService } from '../../database/prisma.service'

const NOW = new Date('2026-11-01T10:00:00.000Z')
const DAY = 24 * 60 * 60 * 1000

function makeService(overrides: { item?: Record<string, unknown> | null; project?: unknown; secret?: unknown; existingTitles?: string[] } = {}) {
  const prisma = {
    checklistItem: {
      findMany: vi.fn().mockResolvedValue((overrides.existingTitles ?? []).map((title) => ({ title }))),
      findFirst: vi.fn().mockResolvedValue(overrides.item === undefined ? { id: 'i1', repeatDays: null } : overrides.item),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'new', ...data })),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'i1', ...data })),
      delete: vi.fn().mockResolvedValue({}),
    },
    project: { findFirst: vi.fn().mockResolvedValue(overrides.project === undefined ? { id: 'p1' } : overrides.project) },
    secret: { findFirst: vi.fn().mockResolvedValue(overrides.secret === undefined ? { id: 's1' } : overrides.secret) },
  }
  return { service: new ChecklistService(prisma as unknown as PrismaService), prisma }
}

async function errorsFor<T extends object>(cls: new () => T, body: unknown) {
  const instance = plainToInstance(cls, body, { enableImplicitConversion: true })
  return validate(instance, { whitelist: true, forbidNonWhitelisted: true })
}

describe('ChecklistService.findAll', () => {
  it('only reads the current user, hides items of deleted projects, and flattens names', async () => {
    const { service, prisma } = makeService()
    prisma.checklistItem.findMany.mockResolvedValue([
      { id: 'a', title: 'T', project: { name: 'Blog' }, secret: { name: 'GitHub token', deletedAt: null } },
      { id: 'b', title: 'U', project: { name: 'Blog' }, secret: { name: 'Old key', deletedAt: new Date() } },
      { id: 'c', title: 'V', project: { name: 'Blog' }, secret: null },
    ])
    const items = await service.findAll('user-1')

    expect(prisma.checklistItem.findMany.mock.calls[0]![0].where).toEqual({ userId: 'user-1', project: { deletedAt: null } })
    expect(items.map((i) => [i.projectName, i.secretName])).toEqual([['Blog', 'GitHub token'], ['Blog', null], ['Blog', null]])
  })
})

describe('ChecklistService.create', () => {
  it('refuses a project that is not the user\'s or is deleted', async () => {
    const { service, prisma } = makeService({ project: null })
    await expect(service.create('user-1', { projectId: 'p9', title: 'T' })).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.project.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'p9', userId: 'user-1', deletedAt: null } }))
    expect(prisma.checklistItem.create).not.toHaveBeenCalled()
  })

  it('refuses to link a secret that is not in the user\'s vault', async () => {
    const { service, prisma } = makeService({ secret: null })
    await expect(service.create('user-1', { projectId: 'p1', title: 'T', secretId: 's9' })).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.secret.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 's9', userId: 'user-1', deletedAt: null } }))
  })

  it('stores the due date as a date and defaults the optional fields', async () => {
    const { service, prisma } = makeService()
    await service.create('user-1', { projectId: 'p1', title: 'Renew domain', dueAt: '2027-01-15T00:00:00.000Z' })
    expect(prisma.checklistItem.create.mock.calls[0]![0].data).toMatchObject({
      userId: 'user-1', projectId: 'p1', note: null, repeatDays: null, secretId: null, dueAt: new Date('2027-01-15T00:00:00.000Z'),
    })
  })
})

describe('ChecklistService.addTemplates', () => {
  it('adds every recommended item to a project that has none', async () => {
    const { service, prisma } = makeService()
    await expect(service.addTemplates('user-1', { projectId: 'p1' })).resolves.toEqual({ created: CHECKLIST_TEMPLATES.length })
    expect(prisma.checklistItem.createMany.mock.calls[0]![0].data).toHaveLength(CHECKLIST_TEMPLATES.length)
  })

  it('skips titles the project already has, so pressing the button twice adds nothing', async () => {
    const { service, prisma } = makeService({ existingTitles: CHECKLIST_TEMPLATES.map((t) => t.title) })
    await expect(service.addTemplates('user-1', { projectId: 'p1' })).resolves.toEqual({ created: 0 })
    expect(prisma.checklistItem.createMany).not.toHaveBeenCalled()
  })
})

describe('ChecklistService.update', () => {
  it('answers 404 for an item of another user', async () => {
    const { service, prisma } = makeService({ item: null })
    await expect(service.update('i1', 'user-2', { done: true })).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.checklistItem.findFirst).toHaveBeenCalledWith({ where: { id: 'i1', userId: 'user-2' } })
    expect(prisma.checklistItem.update).not.toHaveBeenCalled()
  })

  it('checking a repeating item records the time and starts the next interval', async () => {
    const { service, prisma } = makeService({ item: { id: 'i1', repeatDays: 90 } })
    await service.update('i1', 'u', { done: true }, NOW)
    expect(prisma.checklistItem.update.mock.calls[0]![0].data).toEqual({ done: true, doneAt: NOW, dueAt: new Date(NOW.getTime() + 90 * DAY) })
  })

  it('checking an item without a repeat keeps its due date', async () => {
    const { service, prisma } = makeService({ item: { id: 'i1', repeatDays: null } })
    await service.update('i1', 'u', { done: true }, NOW)
    expect(prisma.checklistItem.update.mock.calls[0]![0].data).toEqual({ done: true, doneAt: NOW })
  })

  it('a due date sent together with the check wins over the repeat interval', async () => {
    const { service, prisma } = makeService({ item: { id: 'i1', repeatDays: 30 } })
    await service.update('i1', 'u', { done: true, dueAt: '2027-06-01T00:00:00.000Z' }, NOW)
    expect(prisma.checklistItem.update.mock.calls[0]![0].data.dueAt).toEqual(new Date('2027-06-01T00:00:00.000Z'))
  })

  it('unchecking clears the check time and keeps the due date', async () => {
    const { service, prisma } = makeService()
    await service.update('i1', 'u', { done: false }, NOW)
    expect(prisma.checklistItem.update.mock.calls[0]![0].data).toEqual({ done: false, doneAt: null })
  })

  it('null clears the due date, the note, the repeat, and the linked secret', async () => {
    const { service, prisma } = makeService()
    await service.update('i1', 'u', { dueAt: null, note: null, repeatDays: null, secretId: null }, NOW)
    expect(prisma.checklistItem.update.mock.calls[0]![0].data).toEqual({ dueAt: null, note: null, repeatDays: null, secretId: null })
    expect(prisma.secret.findFirst).not.toHaveBeenCalled()
  })
})

describe('ChecklistService.remove', () => {
  it('deletes only an item of the current user', async () => {
    const { service, prisma } = makeService({ item: null })
    await expect(service.remove('i1', 'user-2')).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.checklistItem.delete).not.toHaveBeenCalled()
  })
})

describe('checklist validation', () => {
  it('limits the repeat interval and requires an ISO date', async () => {
    const base = { projectId: 'p1', title: 'T' }
    expect(await errorsFor(CreateChecklistItemDto, { ...base, repeatDays: 0 })).not.toHaveLength(0)
    expect(await errorsFor(CreateChecklistItemDto, { ...base, repeatDays: 3651 })).not.toHaveLength(0)
    expect(await errorsFor(CreateChecklistItemDto, { ...base, repeatDays: 90 })).toHaveLength(0)
    expect(await errorsFor(CreateChecklistItemDto, { ...base, dueAt: 'next week' })).not.toHaveLength(0)
    expect(await errorsFor(CreateChecklistItemDto, { ...base, title: '' })).not.toHaveLength(0)
  })

  it('rejects the string "false" for done instead of reading it as true, and accepts null to clear', async () => {
    expect(await errorsFor(UpdateChecklistItemDto, { done: 'false' })).not.toHaveLength(0)
    expect(await errorsFor(UpdateChecklistItemDto, { done: false })).toHaveLength(0)
    expect(await errorsFor(UpdateChecklistItemDto, { dueAt: null, note: null, secretId: null, repeatDays: null })).toHaveLength(0)
  })

  it('refuses properties it does not know', async () => {
    expect(await errorsFor(UpdateChecklistItemDto, { userId: 'someone-else' })).not.toHaveLength(0)
  })
})

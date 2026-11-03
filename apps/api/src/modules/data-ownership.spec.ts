import { NotFoundException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'
import { ProjectsService } from './projects/projects.service'
import { SnippetService } from './knowledge/snippet.service'
import { NoteService } from './knowledge/note.service'
import { NotesService } from './workspace/notes.service'
import { BookmarksService } from './workspace/bookmarks.service'
import { PromptsService } from './ai/prompts.service'
import { SettingsService } from './settings/settings.service'
import type { PrismaService } from '../database/prisma.service'
import type { AuditService } from '../shared/services/audit.service'

// Every table below belongs to one user and is soft deleted. The same four promises must hold for each.
interface Delegate {
  findMany: ReturnType<typeof vi.fn>
  findFirst: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

interface Subject {
  name: string
  delegate: 'project' | 'snippet' | 'note' | 'aiPrompt' | 'bookmark'
  make: (prisma: PrismaService, audit: AuditService) => {
    findAll: (userId: string) => Promise<unknown>
    findOne: (id: string, userId: string) => Promise<unknown>
    update: (id: string, userId: string) => Promise<unknown>
    remove: (id: string, userId: string) => Promise<unknown>
  }
}

const page = { page: 3, limit: 10 }

const subjects: Subject[] = [
  {
    name: 'ProjectsService', delegate: 'project',
    make: (p, a) => { const s = new ProjectsService(p, a); return { findAll: (u) => s.findAll(u, {}, page), findOne: (i, u) => s.findOne(i, u), update: (i, u) => s.update(i, u, { name: 'x' }), remove: (i, u) => s.remove(i, u) } },
  },
  {
    name: 'SnippetService', delegate: 'snippet',
    make: (p) => { const s = new SnippetService(p); return { findAll: (u) => s.findAll(u, {}, page), findOne: (i, u) => s.findOne(i, u), update: (i, u) => s.update(i, u, { title: 'x' }), remove: (i, u) => s.remove(i, u) } },
  },
  {
    name: 'NoteService (knowledge)', delegate: 'note',
    make: (p) => { const s = new NoteService(p); return { findAll: (u) => s.findAll(u, {}, page), findOne: (i, u) => s.findOne(i, u), update: (i, u) => s.update(i, u, { title: 'x' }), remove: (i, u) => s.remove(i, u) } },
  },
  {
    name: 'NotesService (workspace)', delegate: 'note',
    make: (p) => { const s = new NotesService(p); return { findAll: (u) => s.findAll(u, page), findOne: (i, u) => s.findOne(i, u), update: (i, u) => s.update(i, u, { title: 'x' }), remove: (i, u) => s.remove(i, u) } },
  },
  {
    name: 'BookmarksService', delegate: 'bookmark',
    make: (p) => { const s = new BookmarksService(p); return { findAll: (u) => s.findAll(u, page), findOne: (i, u) => s.findOne(i, u), update: (i, u) => s.update(i, u, { title: 'x' }), remove: (i, u) => s.remove(i, u) } },
  },
  {
    name: 'PromptsService', delegate: 'aiPrompt',
    make: (p) => { const s = new PromptsService(p); return { findAll: (u) => s.findAll(u, page), findOne: (i, u) => s.findOne(i, u), update: (i, u) => s.update(i, u, { title: 'x' }), remove: (i, u) => s.remove(i, u) } },
  },
]

function setup(subject: Subject, found: unknown) {
  const delegate: Delegate = {
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(found),
    update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'r1', ...data })),
    delete: vi.fn(),
  }
  const prisma = { [subject.delegate]: delegate } as unknown as PrismaService
  const audit = { log: vi.fn() } as unknown as AuditService
  return { service: subject.make(prisma, audit), delegate }
}

describe.each(subjects)('$name', (subject) => {
  it('lists only the current user\'s records that are not deleted, one page at a time', async () => {
    const { service, delegate } = setup(subject, null)
    await service.findAll('user-1')
    const args = delegate.findMany.mock.calls[0]![0]
    expect(args.where).toMatchObject({ userId: 'user-1', deletedAt: null })
    expect(args).toMatchObject({ skip: 20, take: 10 })
  })

  it('answers 404 for a record of another user or a deleted record, using the same filter', async () => {
    const { service, delegate } = setup(subject, null)
    await expect(service.findOne('r1', 'user-2')).rejects.toBeInstanceOf(NotFoundException)
    expect(delegate.findFirst).toHaveBeenCalledWith({ where: { id: 'r1', userId: 'user-2', deletedAt: null } })
  })

  it('writes nothing when the record is not the user\'s', async () => {
    const { service, delegate } = setup(subject, null)
    await expect(service.update('r1', 'user-2')).rejects.toBeInstanceOf(NotFoundException)
    await expect(service.remove('r1', 'user-2')).rejects.toBeInstanceOf(NotFoundException)
    expect(delegate.update).not.toHaveBeenCalled()
  })

  it('removes by marking deletedAt, never by deleting the row', async () => {
    const { service, delegate } = setup(subject, { id: 'r1', userId: 'user-1' })
    await service.remove('r1', 'user-1')
    expect(delegate.delete).not.toHaveBeenCalled()
    expect(delegate.update.mock.calls[0]![0].data.deletedAt).toBeInstanceOf(Date)
  })
})

describe('ProjectsService audit trail', () => {
  it('records creating and deleting a project', async () => {
    const audit = { log: vi.fn() }
    const prisma = { project: { create: vi.fn().mockResolvedValue({ id: 'p1', name: 'Blog' }), findFirst: vi.fn().mockResolvedValue({ id: 'p1' }), update: vi.fn().mockResolvedValue({}) } }
    const service = new ProjectsService(prisma as unknown as PrismaService, audit as unknown as AuditService)

    await service.create('user-1', { name: 'Blog' })
    await service.remove('p1', 'user-1')

    expect(audit.log).toHaveBeenNthCalledWith(1, 'user-1', 'CREATE', 'project', 'p1', { name: 'Blog' })
    expect(audit.log).toHaveBeenNthCalledWith(2, 'user-1', 'DELETE', 'project', 'p1')
  })
})

describe('PromptsService.incrementUsage', () => {
  it('adds one use to a prompt of the current user only', async () => {
    const prisma = { aiPrompt: { findFirst: vi.fn().mockResolvedValue({ id: 'a1' }), update: vi.fn().mockResolvedValue({}) } }
    const service = new PromptsService(prisma as unknown as PrismaService)

    await service.incrementUsage('a1', 'user-1')
    expect(prisma.aiPrompt.update).toHaveBeenCalledWith({ where: { id: 'a1' }, data: { usageCount: { increment: 1 } } })

    prisma.aiPrompt.findFirst.mockResolvedValue(null)
    await expect(service.incrementUsage('a1', 'user-2')).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.aiPrompt.update).toHaveBeenCalledTimes(1)
  })
})

describe('SettingsService', () => {
  const make = () => {
    const prisma = { userSettings: { upsert: vi.fn().mockImplementation((args) => Promise.resolve(args)) } }
    return { service: new SettingsService(prisma as unknown as PrismaService), upsert: prisma.userSettings.upsert }
  }

  it('is keyed by the user, so one user cannot read or change another\'s settings', async () => {
    const { service, upsert } = make()
    await service.findOrCreate('user-1')
    await service.update('user-1', { theme: 'light' })
    expect(upsert.mock.calls.every(([args]) => args.where.userId === 'user-1')).toBe(true)
  })

  it('creates missing settings with defaults and updates only the fields that were sent', async () => {
    const { service, upsert } = make()
    await service.update('user-1', { accentColor: 'rose' })
    const { create, update } = upsert.mock.calls[0]![0]
    expect(create).toEqual({ userId: 'user-1', theme: 'dark', density: 'normal', accentColor: 'rose', sidebarOpen: true })
    expect(update).toEqual({ accentColor: 'rose' })
  })
})

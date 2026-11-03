import { describe, expect, it, vi } from 'vitest'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { BookmarksService } from './bookmarks.service'
import { CreateBookmarkDto } from './dto/create-bookmark.dto'
import { ImportBookmarksDto, MAX_IMPORT_ITEMS } from './dto/import-bookmarks.dto'
import { normalizeBookmarkUrl } from './bookmark-url'
import type { PrismaService } from '../../database/prisma.service'

function makeService(existingUrls: string[] = []) {
  const prisma = {
    bookmark: {
      findMany: vi.fn().mockResolvedValue(existingUrls.map((url) => ({ url }))),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  }
  return { service: new BookmarksService(prisma as unknown as PrismaService), prisma }
}

// Same conversion options as the global ValidationPipe in main.ts.
async function errorsFor<T extends object>(cls: new () => T, body: unknown) {
  const instance = plainToInstance(cls, body, { enableImplicitConversion: true })
  return validate(instance, { whitelist: true, forbidNonWhitelisted: true })
}

describe('normalizeBookmarkUrl', () => {
  it('treats host case, a trailing slash, and the fragment as the same link', () => {
    expect(normalizeBookmarkUrl('https://Example.com/docs/#intro')).toBe(normalizeBookmarkUrl('https://example.com/docs'))
  })

  it('keeps different paths and queries apart', () => {
    expect(normalizeBookmarkUrl('https://example.com/a')).not.toBe(normalizeBookmarkUrl('https://example.com/b'))
    expect(normalizeBookmarkUrl('https://example.com/?q=1')).not.toBe(normalizeBookmarkUrl('https://example.com/?q=2'))
  })
})

describe('BookmarksService.importMany', () => {
  it('skips links that are already saved and repeats inside the file', async () => {
    const { service, prisma } = makeService(['https://saved.example.com/'])
    const result = await service.importMany('user-1', {
      items: [
        { title: 'Saved', url: 'https://SAVED.example.com' },
        { title: 'New', url: 'https://new.example.com/page' },
        { title: 'New again', url: 'https://new.example.com/page#top' },
      ],
    })

    expect(result).toEqual({ created: 1, skipped: 2 })
    const { data } = prisma.bookmark.createMany.mock.calls[0]![0]
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({ userId: 'user-1', title: 'New', url: 'https://new.example.com/page', tags: [] })
  })

  it('only reads the current user and ignores soft-deleted rows when deduplicating', async () => {
    const { service, prisma } = makeService()
    await service.importMany('user-1', { items: [{ title: 'A', url: 'https://a.example.com' }] })
    expect(prisma.bookmark.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1', deletedAt: null } }))
  })

  it('keeps the original date from the browser export', async () => {
    const { service, prisma } = makeService()
    await service.importMany('user-1', { items: [{ title: 'Old', url: 'https://old.example.com', createdAt: '2019-03-04T05:06:07.000Z' }] })
    expect(prisma.bookmark.createMany.mock.calls[0]![0].data[0].createdAt).toEqual(new Date('2019-03-04T05:06:07.000Z'))
  })

  it('writes nothing when every link is a duplicate', async () => {
    const { service, prisma } = makeService(['https://a.example.com'])
    await expect(service.importMany('user-1', { items: [{ title: 'A', url: 'https://a.example.com/' }] })).resolves.toEqual({ created: 0, skipped: 1 })
    expect(prisma.bookmark.createMany).not.toHaveBeenCalled()
  })
})

describe('bookmark validation', () => {
  it('rejects URLs that are not absolute http or https', async () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,hi', 'example.com', 'ftp://example.com/file']) {
      expect(await errorsFor(CreateBookmarkDto, { title: 't', url })).not.toHaveLength(0)
    }
    expect(await errorsFor(CreateBookmarkDto, { title: 't', url: 'http://localhost:3000/x' })).toHaveLength(0)
  })

  it('rejects the string "false" for pinned instead of reading it as true', async () => {
    expect(await errorsFor(CreateBookmarkDto, { title: 't', url: 'https://a.example.com', pinned: 'false' })).not.toHaveLength(0)
    expect(await errorsFor(CreateBookmarkDto, { title: 't', url: 'https://a.example.com', pinned: false })).toHaveLength(0)
  })

  it('caps an import at the item limit and validates every item', async () => {
    const item = { title: 't', url: 'https://a.example.com' }
    expect(await errorsFor(ImportBookmarksDto, { items: Array.from({ length: MAX_IMPORT_ITEMS + 1 }, () => item) })).not.toHaveLength(0)
    expect(await errorsFor(ImportBookmarksDto, { items: [item, { title: 't', url: 'javascript:void(0)' }] })).not.toHaveLength(0)
    expect(await errorsFor(ImportBookmarksDto, { items: [] })).not.toHaveLength(0)
  })
})

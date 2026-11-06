import { describe, expect, it } from 'vitest'
import {
  filterBookmarks,
  normalizeBookmarkUrl,
  parseBookmarkHtml,
  parseTags,
  previewImport,
  toBookmarkHtml,
  toBookmarkJson,
  toHttpUrl,
  type Bookmark,
} from './bookmarks'

// Trimmed copy of a Chrome export: nested folders, ADD_DATE in seconds, a non-web link.
const CHROME_EXPORT = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1700000000" PERSONAL_TOOLBAR_FOLDER="true">Bookmarks bar</H3>
    <DL><p>
        <DT><A HREF="https://nextjs.org/docs" ADD_DATE="1700000100">Next.js Docs</A>
        <DT><H3>Dev</H3>
        <DL><p>
            <DT><A HREF="https://github.com/vercel/next.js" ADD_DATE="1700000200">next.js repo</A>
            <DT><A HREF="chrome://settings/">Settings</A>
        </DL><p>
    </DL><p>
    <DT><A HREF="https://example.com/" TAGS="Read Later,Tools">Example</A>
</DL><p>`

const bookmark = (overrides: Partial<Bookmark>): Bookmark => ({
  id: '1', title: 'Title', url: 'https://example.com', tags: [], pinned: false, createdAt: '2026-01-01T00:00:00.000Z', ...overrides,
})

describe('parseBookmarkHtml', () => {
  it('reads links, turns folders into tags, and skips browser root folders', () => {
    const { items, invalid } = parseBookmarkHtml(CHROME_EXPORT)
    expect(items.map((i) => i.url)).toEqual(['https://nextjs.org/docs', 'https://github.com/vercel/next.js', 'https://example.com/'])
    expect(items[0]?.tags).toEqual([])
    expect(items[1]?.tags).toEqual(['dev'])
    expect(invalid).toBe(1)
  })

  it('keeps the TAGS attribute (Firefox) and the ADD_DATE as an ISO date', () => {
    const { items } = parseBookmarkHtml(CHROME_EXPORT)
    expect(items[2]?.tags).toEqual(['read later', 'tools'])
    expect(items[0]?.createdAt).toBe(new Date(1700000100 * 1000).toISOString())
  })

  it('falls back to the host when a link has no text', () => {
    const { items } = parseBookmarkHtml('<DL><DT><A HREF="https://docs.example.com/a"></A></DL>')
    expect(items[0]?.title).toBe('docs.example.com')
  })
})

describe('previewImport', () => {
  it('counts links already saved and repeats inside the file as duplicates', () => {
    const items = [
      { title: 'a', url: 'https://a.example.com/', tags: [] },
      { title: 'b', url: 'https://b.example.com', tags: [] },
      { title: 'b again', url: 'https://B.example.com/#x', tags: [] },
    ]
    const preview = previewImport(items, 2, [{ url: 'https://a.example.com' }])
    expect(preview.newItems.map((i) => i.title)).toEqual(['b'])
    expect(preview.duplicates).toBe(2)
    expect(preview.invalid).toBe(2)
  })
})

describe('export', () => {
  it('writes a Netscape file that imports back to the same links', () => {
    const saved = [bookmark({ title: 'A & B <test>', url: 'https://a.example.com/?q="x"', tags: ['dev', 'read-later'] })]
    const { items } = parseBookmarkHtml(toBookmarkHtml(saved))
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ title: 'A & B <test>', url: 'https://a.example.com/?q=%22x%22', tags: ['dev', 'read-later'] })
  })

  it('writes JSON without database ids', () => {
    const parsed = JSON.parse(toBookmarkJson([bookmark({ id: 'secret-id' })]))
    expect(parsed[0]).not.toHaveProperty('id')
    expect(parsed[0]).toMatchObject({ title: 'Title', url: 'https://example.com', pinned: false })
  })
})

describe('helpers', () => {
  it('accepts typed URLs without a scheme and rejects other schemes', () => {
    expect(toHttpUrl('example.com/docs')).toBe('https://example.com/docs')
    expect(toHttpUrl('http://localhost:3000')).toBe('http://localhost:3000/')
    expect(toHttpUrl('javascript:alert(1)')).toBeNull()
    expect(toHttpUrl('   ')).toBeNull()
  })

  it('normalises like the API', () => {
    expect(normalizeBookmarkUrl('https://Example.com/docs/#top')).toBe('https://example.com/docs')
  })

  it('parses a comma-separated tag list into unique lowercase tags', () => {
    expect(parseTags(' Dev, read-later ,dev,, ')).toEqual(['dev', 'read-later'])
  })

  it('filters by tag and by text in title, URL, or tags', () => {
    const list = [bookmark({ id: '1', title: 'Next docs', tags: ['dev'] }), bookmark({ id: '2', title: 'Recipe', url: 'https://food.example.com' })]
    expect(filterBookmarks(list, '', 'dev').map((b) => b.id)).toEqual(['1'])
    expect(filterBookmarks(list, 'FOOD', null).map((b) => b.id)).toEqual(['2'])
    expect(filterBookmarks(list, 'dev', null).map((b) => b.id)).toEqual(['1'])
  })
})

export interface Bookmark {
  id: string
  title: string
  url: string
  description?: string | null
  tags: string[]
  pinned: boolean
  createdAt: string
}

export interface ImportItem {
  title: string
  url: string
  tags: string[]
  createdAt?: string
}

export interface ImportPreview {
  newItems: ImportItem[]
  duplicates: number
  invalid: number
}

export const READ_LATER_TAG = 'read-later'
// Must match MAX_IMPORT_ITEMS in apps/api/src/modules/workspace/dto/import-bookmarks.dto.ts.
export const MAX_IMPORT_ITEMS = 2000
const MAX_TITLE = 500
const MAX_TAG = 50
const MAX_TAGS = 30

// Folder names every browser adds at the top level; they say nothing about the link.
const ROOT_FOLDERS = new Set([
  'bookmarks bar', 'bookmarks toolbar', 'other bookmarks', 'mobile bookmarks', 'bookmarks menu', 'bookmarks', 'favorites bar', 'favorites',
])

// Same rule as apps/api/src/modules/workspace/bookmark-url.ts; keep them in sync.
export function normalizeBookmarkUrl(raw: string): string {
  try {
    const url = new URL(raw.trim())
    url.hash = ''
    url.hostname = url.hostname.toLowerCase()
    let text = url.toString()
    if (text.endsWith('/')) text = text.slice(0, -1)
    return text
  } catch {
    return raw.trim()
  }
}

// Accepts what people type ("example.com/docs") and returns an absolute http(s) URL, or null.
export function toHttpUrl(raw: string): string | null {
  const value = raw.trim()
  if (!value) return null
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

export function parseTags(input: string): string[] {
  const tags = input.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).map((t) => t.slice(0, MAX_TAG))
  return Array.from(new Set(tags)).slice(0, MAX_TAGS)
}

function folderTag(name: string): string | null {
  const tag = name.trim().toLowerCase()
  return tag && !ROOT_FOLDERS.has(tag) ? tag.slice(0, MAX_TAG) : null
}

// Netscape bookmark file, exported by Chrome, Edge, Firefox, and Safari. Folders become tags.
export function parseBookmarkHtml(html: string): { items: ImportItem[]; invalid: number } {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const items: ImportItem[] = []
  let invalid = 0

  for (const anchor of Array.from(doc.querySelectorAll('a'))) {
    const url = toHttpUrl(anchor.getAttribute('href') ?? '')
    if (!url) {
      invalid++
      continue
    }

    const folders: string[] = []
    let list = anchor.closest('dl')
    while (list) {
      const heading = list.previousElementSibling?.tagName === 'H3' ? list.previousElementSibling : list.parentElement?.querySelector(':scope > h3')
      const tag = heading ? folderTag(heading.textContent ?? '') : null
      if (tag) folders.unshift(tag)
      list = list.parentElement?.closest('dl') ?? null
    }
    const attrTags = (anchor.getAttribute('tags') ?? '').split(',').map((t) => folderTag(t)).filter((t): t is string => Boolean(t))

    const addDate = Number(anchor.getAttribute('add_date'))
    items.push({
      title: (anchor.textContent ?? '').trim().slice(0, MAX_TITLE) || hostOf(url),
      url,
      tags: Array.from(new Set([...folders, ...attrTags])).slice(0, MAX_TAGS),
      ...(Number.isFinite(addDate) && addDate > 0 && { createdAt: new Date(addDate * 1000).toISOString() }),
    })
  }

  return { items, invalid }
}

export function previewImport(items: ImportItem[], invalid: number, existing: Pick<Bookmark, 'url'>[]): ImportPreview {
  const seen = new Set(existing.map((b) => normalizeBookmarkUrl(b.url)))
  const newItems: ImportItem[] = []
  let duplicates = 0
  for (const item of items) {
    const key = normalizeBookmarkUrl(item.url)
    if (seen.has(key)) {
      duplicates++
      continue
    }
    seen.add(key)
    newItems.push(item)
  }
  return { newItems, duplicates, invalid }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Netscape format, so the file can be imported back into any browser or into DevOS.
export function toBookmarkHtml(bookmarks: Bookmark[]): string {
  const rows = bookmarks.map((b) => {
    const added = Math.floor(new Date(b.createdAt).getTime() / 1000)
    const tags = b.tags.length > 0 ? ` TAGS="${escapeHtml(b.tags.join(','))}"` : ''
    return `    <DT><A HREF="${escapeHtml(b.url)}" ADD_DATE="${added}"${tags}>${escapeHtml(b.title)}</A>`
  })
  return [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
    ...rows,
    '</DL><p>',
    '',
  ].join('\n')
}

export function toBookmarkJson(bookmarks: Bookmark[]): string {
  const data = bookmarks.map(({ title, url, description, tags, pinned, createdAt }) => ({ title, url, description: description ?? null, tags, pinned, createdAt }))
  return JSON.stringify(data, null, 2)
}

export function allTags(bookmarks: Bookmark[]): string[] {
  return Array.from(new Set(bookmarks.flatMap((b) => b.tags))).sort((a, b) => a.localeCompare(b))
}

export function filterBookmarks(bookmarks: Bookmark[], search: string, tag: string | null): Bookmark[] {
  const query = search.trim().toLowerCase()
  return bookmarks.filter((b) => {
    if (tag && !b.tags.includes(tag)) return false
    if (!query) return true
    return b.title.toLowerCase().includes(query) || b.url.toLowerCase().includes(query) || b.tags.some((t) => t.includes(query))
  })
}

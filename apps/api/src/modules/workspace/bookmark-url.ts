// Same rule as apps/web/src/lib/bookmarks.ts normalizeBookmarkUrl; keep them in sync.
// Two URLs count as the same link when they differ only in host case, a trailing slash, or the #fragment.
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

'use client'

import * as React from 'react'
import { fetchApi } from '@/lib/api'
import { MAX_SITES, describeHealth, type HealthResult } from '@/lib/sites'
import type { Bookmark } from '@/lib/bookmarks'

export interface LinkCheck {
  ok: boolean
  text: string
}

// Manual, on demand: reuses the uptime check endpoint in batches of its 20-URL limit. A batch the API
// refuses (for example one containing a localhost link) is marked and the remaining batches still run.
export function useLinkCheck() {
  const [results, setResults] = React.useState<Map<string, LinkCheck>>(new Map())
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null)

  const run = async (bookmarks: Bookmark[]) => {
    setResults(new Map())
    setProgress({ done: 0, total: bookmarks.length })

    for (let start = 0; start < bookmarks.length; start += MAX_SITES) {
      const batch = bookmarks.slice(start, start + MAX_SITES)
      let checks: LinkCheck[]
      try {
        const urls = encodeURIComponent(batch.map((b) => b.url).join(','))
        const health = await fetchApi<HealthResult[]>(`/infrastructure/health/batch?urls=${urls}`)
        checks = batch.map((_, index) => {
          const result = health[index]
          return { ok: Boolean(result?.online), text: result?.online ? 'Link works' : describeHealth(result) }
        })
      } catch {
        checks = batch.map(() => ({ ok: false, text: 'Could not check' }))
      }
      setResults((previous) => {
        const next = new Map(previous)
        batch.forEach((bookmark, index) => next.set(bookmark.id, checks[index] ?? { ok: false, text: 'Could not check' }))
        return next
      })
      setProgress({ done: start + batch.length, total: bookmarks.length })
    }
  }

  const running = progress !== null && progress.done < progress.total
  return { run, results, progress, running }
}

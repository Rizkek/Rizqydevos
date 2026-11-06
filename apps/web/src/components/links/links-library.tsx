'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Link2, Plus, Search, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { fetchApi } from '@/lib/api'
import { createQueryOptions, queryKeys } from '@/lib/query'
import { cn } from '@/lib/utils'
import { allTags, filterBookmarks, toBookmarkHtml, toBookmarkJson, type Bookmark } from '@/lib/bookmarks'
import { LinkForm, type LinkFormValues } from './link-form'
import { ImportLinks } from './import-links'
import { LinkRow } from './link-row'
import { Bookmarklet } from './bookmarklet'
import { useLinkCheck } from './use-link-check'

type Panel = { kind: 'form'; values: LinkFormValues } | { kind: 'import' } | null

const EMPTY_FORM: LinkFormValues = { url: '', title: '', tags: [], pinned: false }

function download(name: string, type: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = Object.assign(document.createElement('a'), { href: url, download: name })
  link.click()
  URL.revokeObjectURL(url)
}

export function LinksLibrary() {
  const queryClient = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [tag, setTag] = React.useState<string | null>(null)
  const [panel, setPanel] = React.useState<Panel>(null)
  const check = useLinkCheck()

  const { data: bookmarks = [], isLoading, error, refetch } = useQuery(
    createQueryOptions(queryKeys.bookmarks, () => fetchApi<Bookmark[]>('/workspace/bookmarks/all')),
  )
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.bookmarks })
  const togglePin = useMutation({
    mutationFn: (b: Bookmark) => fetchApi(`/workspace/bookmarks/${b.id}`, { method: 'PATCH', body: JSON.stringify({ pinned: !b.pinned }) }),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => fetchApi(`/workspace/bookmarks/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })

  const tags = allTags(bookmarks)
  const visible = filterBookmarks(bookmarks, search, tag)
  const stamp = new Date().toISOString().slice(0, 10)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, URL, or tag" aria-label="Search links" className="w-full bg-[var(--color-surface)] pl-9" />
        </div>
        <Button onClick={() => setPanel({ kind: 'form', values: EMPTY_FORM })}><Plus size={16} aria-hidden="true" /> Add link</Button>
        <Button variant="outline" onClick={() => setPanel({ kind: 'import' })}><Upload size={16} aria-hidden="true" /> Import</Button>
        <Button variant="outline" disabled={bookmarks.length === 0} onClick={() => download(`devos-links-${stamp}.html`, 'text/html', toBookmarkHtml(bookmarks))}>
          <Download size={16} aria-hidden="true" /> Export HTML
        </Button>
        <Button variant="outline" disabled={bookmarks.length === 0} onClick={() => download(`devos-links-${stamp}.json`, 'application/json', toBookmarkJson(bookmarks))}>
          <Download size={16} aria-hidden="true" /> Export JSON
        </Button>
        <Button variant="outline" disabled={visible.length === 0 || check.running} onClick={() => void check.run(visible)}>
          {check.running ? 'Checking…' : 'Check links'}
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Filter by tag" role="group">
          {[null, ...tags].map((value) => (
            <button
              key={value ?? 'all'}
              type="button"
              aria-pressed={tag === value}
              onClick={() => setTag(value)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-[12px]',
                tag === value ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-muted)] text-[var(--color-accent-text)]' : 'border-[var(--color-border)] text-[var(--color-text-2)] hover:bg-[var(--color-surface-2)]',
              )}
            >
              {value ?? 'All'}
            </button>
          ))}
        </div>
      )}

      <p role="status" className="text-[12px] text-[var(--color-text-2)]">
        {check.progress ? `Checked ${check.progress.done} of ${check.progress.total} links.` : ''}
      </p>

      <div className="min-h-0 flex-1 overflow-y-auto pb-8">
        {isLoading ? (
          <ListSkeleton label="Loading links" rows={6} />
        ) : error ? (
          <div role="status" className="flex flex-col items-center gap-3 p-8 text-center text-[13px] text-[var(--color-text-2)]">
            <p>{error instanceof Error ? error.message : 'Could not load links.'}</p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>Try again</Button>
          </div>
        ) : bookmarks.length === 0 ? (
          <EmptyState icon={Link2} title="No links yet" description="Add a link, import your browser bookmarks, or use the bookmarklet below to save pages as you browse." />
        ) : visible.length === 0 ? (
          <p className="p-8 text-center text-[13px] text-[var(--color-text-2)]">No links match this search.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {visible.map((b) => (
              <LinkRow
                key={b.id}
                bookmark={b}
                checkStatus={check.results.get(b.id)}
                onTogglePin={() => togglePin.mutate(b)}
                onEdit={() => setPanel({ kind: 'form', values: { id: b.id, url: b.url, title: b.title, description: b.description ?? null, tags: b.tags, pinned: b.pinned } })}
                onDelete={() => { if (confirm(`Delete ${b.title}?`)) remove.mutate(b.id) }}
              />
            ))}
          </ul>
        )}
        <div className="mt-6"><Bookmarklet /></div>
      </div>

      <Sheet open={panel !== null} onOpenChange={(open) => { if (!open) setPanel(null) }}>
        <SheetContent className="overflow-y-auto p-6">
          <SheetTitle className="mb-4 text-[15px] font-semibold text-[var(--color-text)]">
            {panel?.kind === 'import' ? 'Import bookmarks' : panel?.kind === 'form' && panel.values.id ? 'Edit link' : 'Add link'}
          </SheetTitle>
          {panel?.kind === 'form' && <LinkForm initial={panel.values} onSaved={() => setPanel(null)} onCancel={() => setPanel(null)} />}
          {panel?.kind === 'import' && <ImportLinks existing={bookmarks} onDone={() => setPanel(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

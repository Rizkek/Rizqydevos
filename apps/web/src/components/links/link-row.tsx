'use client'

import { Edit2, Pin, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { hostOf, type Bookmark } from '@/lib/bookmarks'

interface LinkRowProps {
  bookmark: Bookmark
  // Result of the manual link check, already phrased for display (for example "Offline, HTTP 404").
  checkStatus?: { ok: boolean; text: string } | undefined
  onTogglePin: () => void
  onEdit: () => void
  onDelete: () => void
}

export function LinkRow({ bookmark, checkStatus, onTogglePin, onEdit, onDelete }: LinkRowProps) {
  return (
    <li className="group flex items-start gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3">
      <div className="min-w-0 flex-1">
        <a href={bookmark.url} target="_blank" rel="noreferrer" className="block truncate text-[13px] font-medium text-[var(--color-text)] hover:underline">
          {bookmark.title}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <span className="block truncate font-mono text-[12px] text-[var(--color-text-2)]">{hostOf(bookmark.url)}</span>
        {bookmark.description && <p className="mt-1 line-clamp-2 text-[12px] text-[var(--color-text-2)]">{bookmark.description}</p>}
        {(bookmark.tags.length > 0 || checkStatus) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {bookmark.tags.map((tag) => (
              <span key={tag} className="rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[12px] text-[var(--color-text-2)]">{tag}</span>
            ))}
            {checkStatus && (
              <span className={cn('text-[12px]', checkStatus.ok ? 'text-[var(--color-text-2)]' : 'text-[var(--color-danger)]')}>{checkStatus.text}</span>
            )}
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-pressed={bookmark.pinned}
          aria-label={bookmark.pinned ? `Unpin ${bookmark.title}` : `Pin ${bookmark.title}`}
          onClick={onTogglePin}
          className={cn(bookmark.pinned && 'text-[var(--color-accent)]')}
        >
          <Pin size={14} aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={`Edit ${bookmark.title}`} onClick={onEdit}>
          <Edit2 size={14} aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={`Delete ${bookmark.title}`} onClick={onDelete} className="hover:text-[var(--color-danger)]">
          <Trash2 size={14} aria-hidden="true" />
        </Button>
      </div>
    </li>
  )
}

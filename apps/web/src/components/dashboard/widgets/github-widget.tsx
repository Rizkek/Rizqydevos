'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'
import { GitPullRequest, GitCommit, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

const events = [
  { id: '1', type: 'commit', repo: 'rizkek/devos', message: 'feat: command palette', time: '2h ago' },
  { id: '2', type: 'pr', repo: 'rizkek/devos', message: 'Phase 1 MVP', time: '5h ago' },
  { id: '3', type: 'commit', repo: 'rizkek/devos', message: 'fix: layout typo', time: '6h ago' },
  { id: '4', type: 'commit', repo: 'rizkek/trason', message: 'update docs', time: '1d ago' },
]

export function GithubWidget() {
  return (
    <WidgetCard
      id="w-github"
      type="github"
      title="GitHub Activity"
      headerAction={
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-[var(--radius-sm)] text-[var(--color-text-2)] hover:text-[var(--color-text)]">
          <ExternalLink size={14} />
        </Button>
      }
      contentClassName="p-3"
    >
      <div className="flex flex-col gap-2 h-full">
        <div className="grid grid-cols-7 gap-1 p-2 bg-[var(--color-surface-2)] rounded-md border border-[var(--color-border-subtle)] mb-2 shrink-0">
          {/* Mock contribution graph */}
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className={`h-2 rounded-[2px] ${Math.random() > 0.6 ? 'bg-[var(--color-success)]' : 'bg-[var(--color-surface-3)]'}`} />
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1">
          {events.map(ev => (
            <div key={ev.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer">
              <div className="mt-0.5 text-[var(--color-text-muted)]">
                {ev.type === 'commit' ? <GitCommit size={14} /> : <GitPullRequest size={14} className="text-[var(--color-info)]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-[var(--color-text-muted)] truncate">{ev.repo}</div>
                <div className="text-[13px] text-[var(--color-text)] truncate">{ev.message}</div>
              </div>
              <div className="text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">{ev.time}</div>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  )
}

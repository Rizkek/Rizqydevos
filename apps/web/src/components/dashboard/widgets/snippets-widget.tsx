'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'
import { Copy, Code2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const snippets = [
  { id: '1', title: 'React Query Boilerplate', lang: 'tsx' },
  { id: '2', title: 'Dockerfile Node 22', lang: 'dockerfile' },
  { id: '3', title: 'Zustand Persist', lang: 'ts' },
  { id: '4', title: 'Tailwind Config', lang: 'json' },
]

export function SnippetsWidget() {
  return (
    <WidgetCard
      id="w-snippets"
      type="snippets"
      title="Pinned Snippets"
      contentClassName="p-3"
    >
      <div className="flex flex-col gap-1 overflow-y-auto h-full pr-1">
        {snippets.map(s => (
          <div key={s.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-[var(--color-surface-2)] border border-transparent hover:border-[var(--color-border-subtle)] transition-all cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <Code2 size={14} className="text-[var(--color-text-muted)] shrink-0" />
              <span className="text-[13px] text-[var(--color-text)] font-medium truncate">{s.title}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <Badge variant="secondary" className="h-5 text-[9px] uppercase font-mono tracking-wider">
                {s.lang}
              </Badge>
              <button className="opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-opacity p-1">
                <Copy size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}

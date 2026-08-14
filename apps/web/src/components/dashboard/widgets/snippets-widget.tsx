'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'
import { Copy, Code2, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { WidgetConfig } from '@/stores/widget.store'

export function SnippetsWidget({ config }: { config?: WidgetConfig }) {
  const { data: snippets, isLoading } = useQuery({
    queryKey: ['snippets'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/api/v1/knowledge/snippets', {
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed to fetch snippets')
      return res.json()
    }
  })

  return (
    <WidgetCard
      id="w-snippets"
      type="snippets"
      title="Pinned Snippets"
      contentClassName="p-3"
    >
      <div className="flex flex-col gap-1 overflow-y-auto h-full pr-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-2)] gap-2 text-[12px]">
            <Loader2 size={14} className="animate-spin" /> Fetching...
          </div>
        ) : snippets?.length > 0 ? (
          snippets.map((s: any) => (
            <div key={s.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-[var(--color-surface-2)] border border-transparent hover:border-[var(--color-border-subtle)] transition-all cursor-pointer">
              <div className="flex items-center gap-3 min-w-0">
                <Code2 size={14} className="text-[var(--color-text-muted)] shrink-0" />
                <span className="text-[13px] text-[var(--color-text)] font-medium truncate">{s.title}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <Badge variant="secondary" className="h-5 text-[9px] uppercase font-mono tracking-wider">
                  {s.language}
                </Badge>
                <button className="opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-opacity p-1">
                  <Copy size={12} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-[12px] text-[var(--color-text-muted)] italic">
            No snippets found.
          </div>
        )}
      </div>
    </WidgetCard>
  )
}

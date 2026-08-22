'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'
import { GitPullRequest, GitCommit, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetConfig } from '@/stores/widget.store'
import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'

export function GithubWidget({ config }: { config: WidgetConfig }) {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['github-activity'],
    queryFn: async () => {
      return fetchApi<any[]>('/integrations/github/activity').catch((err) => {
        throw new Error('Integration not configured')
      })
    }
  })

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
        
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-2)] gap-2 text-[12px]">
              <Loader2 size={14} className="animate-spin" /> Fetching...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] gap-2 text-[12px]">
              <AlertCircle size={16} /> Not configured
            </div>
          ) : events?.slice(0, 5).map((event: any) => (
            <div key={event.id} className="flex gap-2.5 items-start">
              <div className="mt-0.5 text-[var(--color-text-2)] bg-[var(--color-surface-2)] p-1 rounded-md">
                {event.type === 'PullRequestEvent' ? <GitPullRequest size={12} /> : <GitCommit size={12} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-[var(--color-text)] truncate font-medium">
                  {event.repo.name.split('/').pop()}
                </div>
                <div className="text-[11px] text-[var(--color-text-muted)] truncate mt-0.5">
                  {event.type.replace('Event', '')}
                </div>
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">
                {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  )
}

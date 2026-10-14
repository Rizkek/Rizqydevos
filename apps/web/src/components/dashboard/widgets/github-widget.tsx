'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'
import { GitPullRequest, GitCommit, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IntegrationNotice } from '@/components/shared/integration-notice'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { WidgetConfig } from '@/stores/widget.store'
import { useGithubActivity } from '@/lib/integrations'
import { formatTimestamp } from '@/lib/format'

export function GithubWidget({ config }: { config: WidgetConfig }) {
  const { data: events, isLoading, error, refetch } = useGithubActivity()
  const login = events?.[0]?.actor.login

  return (
    <WidgetCard
      id="w-github"
      type="github"
      title="GitHub Activity"
      headerAction={
        login ? (
          <Button asChild variant="ghost" size="icon" className="h-6 w-6 rounded-[var(--radius-sm)] text-[var(--color-text-2)] hover:text-[var(--color-text)]">
            <a href={`https://github.com/${login}`} target="_blank" rel="noreferrer" aria-label={`Open ${login} on GitHub (opens in a new tab)`}>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </Button>
        ) : undefined
      }
      contentClassName="p-3"
    >
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ListSkeleton label="Loading GitHub activity" rows={4} />
        ) : error ? (
          <IntegrationNotice error={error} provider="github" onRetry={() => void refetch()} className="h-full" />
        ) : !events || events.length === 0 ? (
          <p className="p-3 text-center text-[13px] text-[var(--color-text-2)]">No recent activity.</p>
        ) : (
          <ul className="space-y-3">
            {events.slice(0, 5).map((event) => (
              <li key={event.id} className="flex gap-2.5 items-start">
                <div aria-hidden="true" className="mt-0.5 text-[var(--color-text-2)] bg-[var(--color-surface-2)] p-1 rounded-md">
                  {event.type === 'PullRequestEvent' ? <GitPullRequest size={12} /> : <GitCommit size={12} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[var(--color-text)] truncate font-medium">
                    {event.repo.name.split('/').pop()}
                  </div>
                  <div className="text-[12px] text-[var(--color-text-2)] truncate mt-0.5">
                    {(event.type ?? 'Activity').replace(/Event$/, '')}
                  </div>
                </div>
                {event.createdAt && (
                  <time dateTime={event.createdAt} className="text-[12px] text-[var(--color-text-2)] whitespace-nowrap">
                    {formatTimestamp(event.createdAt)}
                  </time>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </WidgetCard>
  )
}

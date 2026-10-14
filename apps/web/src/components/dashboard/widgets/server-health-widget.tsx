'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'
import { Badge } from '@/components/ui/badge'
import { IntegrationNotice } from '@/components/shared/integration-notice'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { WidgetConfig } from '@/stores/widget.store'
import { useVercelDeployments } from '@/lib/integrations'

export function ServerHealthWidget({ config }: { config: WidgetConfig }) {
  const { data: deployments, isLoading, error, refetch } = useVercelDeployments()

  return (
    <WidgetCard
      id="w-server-health"
      type="server-health"
      title="Recent Deployments"
      contentClassName="p-3"
    >
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ListSkeleton label="Loading deployments" rows={4} />
        ) : error ? (
          <IntegrationNotice error={error} provider="vercel" onRetry={() => void refetch()} className="h-full" />
        ) : !deployments || deployments.length === 0 ? (
          <p className="p-3 text-center text-[13px] text-[var(--color-text-2)]">No recent deployments.</p>
        ) : (
          <ul className="space-y-2">
            {deployments.slice(0, 4).map((dep) => (
              <li key={dep.id}>
                <a
                  href={dep.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col p-2 rounded-md bg-[var(--color-surface-2)]/50 border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-[var(--color-text)] truncate pr-2">
                      {dep.name}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </span>
                    <Badge variant={dep.state === 'READY' ? 'success' : dep.state === 'ERROR' ? 'destructive' : 'warning'} className="shrink-0 text-[12px] px-1.5">
                      {dep.state ?? 'UNKNOWN'}
                    </Badge>
                  </div>
                  <span className="text-[12px] text-[var(--color-text-2)] font-mono mt-1 truncate">{dep.url}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </WidgetCard>
  )
}

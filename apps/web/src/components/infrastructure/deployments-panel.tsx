'use client'

import { Cloud, ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { IntegrationNotice } from '@/components/shared/integration-notice'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { useVercelDeployments } from '@/lib/integrations'

export function DeploymentsPanel() {
  const { data: deployments, isLoading, error, refetch } = useVercelDeployments()

  return (
    <Card className="flex flex-col h-full bg-[var(--color-surface)] border-[var(--color-border-subtle)] overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
        <h2 className="font-medium text-[var(--color-text)] flex items-center gap-2">
          <Cloud size={16} aria-hidden="true" className="text-[var(--color-text-2)]" />
          Vercel Deployments
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <ListSkeleton label="Loading deployments" rows={5} />
        ) : error ? (
          <IntegrationNotice error={error} provider="vercel" onRetry={() => void refetch()} className="h-full" />
        ) : !deployments || deployments.length === 0 ? (
          <p className="text-center text-[13px] text-[var(--color-text-2)]">No recent deployments found.</p>
        ) : (
          <ul className="space-y-3">
            {deployments.map((dep) => (
              <li key={dep.id}>
                <a
                  href={dep.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border-subtle)] transition-colors group"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-medium text-[var(--color-text)]">
                      {dep.name}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </span>
                    <span className="text-[12px] text-[var(--color-text-2)] font-mono">{dep.url}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[12px] text-[var(--color-text-2)] px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] uppercase">
                      {dep.environment}
                    </span>
                    <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-2)]">
                      <span
                        aria-hidden="true"
                        className={`w-2 h-2 rounded-full ${dep.state === 'READY' ? 'bg-[var(--color-success)]' : dep.state === 'ERROR' ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-warning)]'}`}
                      />
                      {dep.state ?? 'UNKNOWN'}
                    </span>
                    <ArrowUpRight size={14} aria-hidden="true" className="text-[var(--color-text-2)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity" />
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

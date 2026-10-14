'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { Server, Cloud, ArrowUpRight } from 'lucide-react'

import { fetchApi } from '@/lib/api'
import { createQueryOptions, queryKeys } from '@/lib/query'
import { IntegrationNotice } from '@/components/shared/integration-notice'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { useVercelDeployments } from '@/lib/integrations'

export default function InfrastructurePage() {
  const { data: deployments, isLoading: isLoadingDeployments, error: vercelError, refetch: refetchDeployments } = useVercelDeployments()

  const { data: healthChecks, isLoading: isLoadingHealth } = useQuery({
    ...createQueryOptions(queryKeys.healthChecks, () => fetchApi<any[]>('/monitoring/health/batch?urls=https://vercel.com,https://github.com,https://api.github.com,https://registry.npmjs.org')),
    refetchInterval: 30000,
  })

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Infrastructure</h1>
        <p className="text-[14px] text-[var(--color-text-2)] mt-1">Deployment status and health monitoring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 h-full">
        {/* Vercel Pane */}
        <Card className="flex flex-col h-full bg-[var(--color-surface)] border-[var(--color-border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
            <h3 className="font-medium text-[var(--color-text)] flex items-center gap-2">
              <Cloud size={16} className="text-[var(--color-text-2)]" />
              Vercel Deployments
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoadingDeployments ? (
              <ListSkeleton label="Loading deployments" rows={5} />
            ) : vercelError ? (
              <IntegrationNotice error={vercelError} provider="vercel" onRetry={() => void refetchDeployments()} className="h-full" />
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

        {/* Health Check Pane */}
        <Card className="flex flex-col h-full bg-[var(--color-surface)] border-[var(--color-border-subtle)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
            <h3 className="font-medium text-[var(--color-text)] flex items-center gap-2">
              <Server size={16} className="text-[var(--color-text-2)]" />
              Service Health
            </h3>
            <span className="px-2 py-0.5 rounded text-[12px] font-mono bg-[var(--color-success-muted)] text-[var(--color-success)] border border-[var(--color-success)]/30">
              {healthChecks?.some(h => h.status !== 'up') ? 'DEGRADED' : 'ALL SYSTEMS NOMINAL'}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoadingHealth ? (
              <div className="flex items-center justify-center h-full text-[var(--color-text-2)] gap-2">
                <span role="status">Checking health...</span>
              </div>
            ) : healthChecks?.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-[13px]">
                No endpoints configured.
              </div>
            ) : (
              healthChecks?.map((hc: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)]">
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-medium text-[var(--color-text)]">{hc.url}</span>
                    <span className="text-[12px] text-[var(--color-text-muted)]">{hc.statusText || 'OK'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-mono text-[var(--color-text-muted)]">{hc.responseTime}ms</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${hc.status === 'up' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-danger)]'}`} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
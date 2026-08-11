'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Server, Cloud, AlertCircle, ArrowUpRight, Activity } from 'lucide-react'

import { fetchApi } from '@/lib/api'
import Link from 'next/link'

export default function InfrastructurePage() {
  const { data: deployments, isLoading: isLoadingDeployments, error: vercelError } = useQuery({
    queryKey: ['vercel-deployments'],
    queryFn: async () => {
      try {
        return await fetchApi<any[]>('/integrations/vercel/deployments')
      } catch (err: any) {
        throw new Error(err.message || 'Failed to fetch Vercel deployments. Ensure you have configured your token.')
      }
    },
    retry: false
  })

  const { data: healthChecks, isLoading: isLoadingHealth } = useQuery({
    queryKey: ['health-checks'],
    queryFn: () => fetchApi<any[]>('/monitoring/health/batch?urls=https://vercel.com,https://github.com,https://api.github.com,https://registry.npmjs.org'),
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
              <div className="flex items-center justify-center h-full text-[var(--color-text-2)] gap-2">
                <Loader2 size={16} className="animate-spin" /> Fetching deployments...
              </div>
            ) : vercelError ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] gap-3">
                <AlertCircle size={24} className="text-[var(--color-text-2)]" />
                <span className="text-[13px]">{vercelError.message}</span>
                <Link href="/settings" className="px-3 py-1.5 text-[12px] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-3)] transition-colors">
                  Configure Integration
                </Link>
              </div>
            ) : deployments?.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] text-[13px]">
                No recent deployments found.
              </div>
            ) : (
              deployments?.map((dep: any) => (
                <a 
                  key={dep.id} 
                  href={`https://${dep.url}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] border border-[var(--color-border-subtle)] transition-colors group"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-medium text-[var(--color-text)] flex items-center gap-2">
                      {dep.name}
                      <span className={`w-2 h-2 rounded-full ${dep.state === 'READY' ? 'bg-green-500' : dep.state === 'ERROR' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    </span>
                    <span className="text-[12px] text-[var(--color-text-muted)] font-mono">
                      {dep.url}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] text-[var(--color-text-muted)] px-1.5 py-0.5 rounded border border-[var(--color-border)] bg-[var(--color-bg)] uppercase">
                      {dep.project}
                    </span>
                    <ArrowUpRight size={14} className="text-[var(--color-text-2)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ))
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
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-green-500/10 text-green-500 border border-green-500/20">
              {healthChecks?.some(h => h.status !== 'up') ? 'DEGRADED' : 'ALL SYSTEMS NOMINAL'}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoadingHealth ? (
              <div className="flex items-center justify-center h-full text-[var(--color-text-2)] gap-2">
                <Loader2 size={16} className="animate-spin" /> Checking health...
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
                    <span className="text-[11px] text-[var(--color-text-muted)]">{hc.statusText || 'OK'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-[var(--color-text-muted)]">{hc.responseTime}ms</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${hc.status === 'up' ? 'bg-green-500' : 'bg-red-500'}`} />
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
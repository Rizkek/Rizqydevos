'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Server, Cloud, AlertCircle, ArrowUpRight, Activity } from 'lucide-react'

export default function InfrastructurePage() {
  const { data: deployments, isLoading, error } = useQuery({
    queryKey: ['vercel-deployments'],
    queryFn: async () => {
      const res = await fetch('http://localhost:3001/api/v1/integrations/vercel/deployments', {
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Failed to fetch Vercel deployments. Ensure you have configured your token.')
      return res.json()
    }
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
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-[var(--color-text-2)] gap-2">
                <Loader2 size={16} className="animate-spin" /> Fetching deployments...
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] gap-3">
                <AlertCircle size={24} className="text-[var(--color-text-2)]" />
                <span className="text-[13px]">{error.message}</span>
                <button className="px-3 py-1.5 text-[12px] bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-3)]">
                  Configure Integration
                </button>
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
              Health Checks
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20">
              ALL SYSTEMS NOMINAL
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-[var(--color-text-muted)] gap-3">
             <Activity size={24} className="text-[var(--color-text-2)] opacity-50" />
             <p className="text-[13px]">Monitoring configured endpoints...</p>
             <p className="text-[12px] text-[var(--color-text-muted)] max-w-xs text-center">Health checks are running in simulation mode.</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
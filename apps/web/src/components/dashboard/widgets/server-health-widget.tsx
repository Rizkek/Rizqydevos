'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { Loader2, AlertCircle, Cloud } from 'lucide-react'
import { WidgetConfig } from '@/stores/widget.store'
import { fetchApi } from '@/lib/api'
import { createQueryOptions, queryKeys } from '@/lib/query'

type Deployment = {
  id: string
  name: string
  state: string
  url: string
}

export function ServerHealthWidget({ config }: { config: WidgetConfig }) {
  const { data: deployments = [], isLoading, error } = useQuery<Deployment[]>(
    createQueryOptions(queryKeys.vercelDeployments, async () => fetchApi('/integrations/vercel/deployments'))
  )
  return (
    <WidgetCard
      id="w-server-health"
      type="server-health"
      title="Recent Deployments"
      contentClassName="p-3"
    >
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-2)] gap-2 text-[12px]">
            <Loader2 size={14} className="animate-spin" /> Fetching...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)] gap-2 text-[12px]">
            <AlertCircle size={16} /> Not configured
          </div>
        ) : deployments.slice(0, 4).map((dep) => (
          <div key={dep.id} className="flex flex-col p-2 rounded-md bg-[var(--color-surface-2)]/50 border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[var(--color-text)] truncate pr-2">{dep.name}</span>
              <Badge variant={dep.state === 'READY' ? 'success' : dep.state === 'ERROR' ? 'destructive' : 'warning'} className="h-4 text-[9px] px-1.5">
                {dep.state}
              </Badge>
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono mt-1 truncate">{dep.url}</span>
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}

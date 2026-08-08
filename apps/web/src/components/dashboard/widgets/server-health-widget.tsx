'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'
import { Badge } from '@/components/ui/badge'

const services = [
  { name: 'API Server', status: 'online', ping: '12ms' },
  { name: 'PostgreSQL', status: 'online', ping: '2ms' },
  { name: 'Redis Cache', status: 'online', ping: '1ms' },
  { name: 'Worker (BullMQ)', status: 'degraded', ping: '150ms' },
]

export function ServerHealthWidget() {
  return (
    <WidgetCard
      id="w-server-health"
      type="server-health"
      title="System Health"
      contentClassName="p-3"
    >
      <div className="flex flex-col gap-2">
        {services.map(service => (
          <div key={service.name} className="flex items-center justify-between p-2 rounded-md bg-[var(--color-surface-2)]/50 border border-[var(--color-border-subtle)]">
            <span className="text-[13px] font-medium text-[var(--color-text)]">{service.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-[var(--color-text-muted)]">{service.ping}</span>
              <Badge variant={service.status === 'online' ? 'success' : service.status === 'degraded' ? 'warning' : 'destructive'} className="h-5 text-[10px]">
                {service.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}

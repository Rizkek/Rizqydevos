'use client'

import Link from 'next/link'
import { Globe, RefreshCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { useSiteChecks } from './use-site-checks'
import {
  describeHealth,
  describeSsl,
  type HealthResult,
  type SslResult,
} from '@/lib/sites'
import { cn } from '@/lib/utils'

function toneFor(health: HealthResult | undefined, ssl: SslResult | undefined, https: boolean): string {
  if (!health) return 'bg-[var(--color-surface-3)]'
  if (!health.online || ssl?.status === 'EXPIRED' || (https && ssl?.status === 'ERROR')) return 'bg-[var(--color-danger)]'
  if (ssl?.status === 'EXPIRING_SOON') return 'bg-[var(--color-warning)]'
  return 'bg-[var(--color-success)]'
}

// Uptime and SSL expiry for the deploy URLs entered in Projects.
export function SitesPanel() {
  const { projects, sites, health, ssl } = useSiteChecks()

  const refresh = () => {
    void health.refetch()
    void ssl.refetch()
  }

  const checking = health.isFetching || ssl.isFetching

  return (
    <Card className="flex flex-col h-full bg-[var(--color-surface)] border-[var(--color-border-subtle)] overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between shrink-0">
        <h2 className="font-medium text-[var(--color-text)] flex items-center gap-2">
          <Globe size={16} aria-hidden="true" className="text-[var(--color-text-2)]" />
          Your Sites
        </h2>
        {sites.length > 0 && (
          <Button variant="ghost" size="sm" onClick={refresh} disabled={checking} className="gap-1">
            <RefreshCcw size={14} aria-hidden="true" /> {checking ? 'Checking…' : 'Check now'}
          </Button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {projects.isLoading ? (
          <ListSkeleton label="Loading projects" rows={4} />
        ) : projects.error ? (
          <div role="status" className="flex flex-col items-center gap-3 text-center text-[13px] text-[var(--color-text-2)]">
            <p>Could not load projects.</p>
            <Button variant="outline" size="sm" onClick={() => void projects.refetch()}>Try again</Button>
          </div>
        ) : sites.length === 0 ? (
          <div className="flex flex-col items-center gap-3 text-center text-[13px] text-[var(--color-text-2)]">
            <p>No project has a deploy URL yet. Add one to check its uptime and SSL certificate.</p>
            <Button asChild variant="outline" size="sm"><Link href="/projects">Open Projects</Link></Button>
          </div>
        ) : (
          <>
            {(health.error || ssl.error) && (
              <p role="status" className="mb-3 text-[13px] text-[var(--color-danger)]">
                Some checks failed to run. Use “Check now” to try again.
              </p>
            )}
            <ul className="space-y-3" aria-busy={health.isLoading || ssl.isLoading}>
              {sites.map((site) => {
                const healthResult = health.data?.find((r) => r.url === site.url)
                const sslResult = ssl.data?.find((r) => r.hostname === site.hostname)
                return (
                  <li key={site.url} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)]">
                    <span aria-hidden="true" className={cn('mt-1.5 w-2.5 h-2.5 rounded-full shrink-0', toneFor(healthResult, sslResult, site.https))} />
                    <div className="flex-1 min-w-0">
                      <a href={site.url} target="_blank" rel="noreferrer" className="block text-[13px] font-medium text-[var(--color-text)] hover:underline">
                        {site.name}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                      <span className="block text-[12px] font-mono text-[var(--color-text-2)] truncate">{site.url}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-[12px] text-[var(--color-text-2)] shrink-0">
                      <span>{health.isLoading ? 'Checking…' : describeHealth(healthResult)}</span>
                      <span>{site.https ? (ssl.isLoading ? 'Checking SSL…' : describeSsl(sslResult)) : 'No HTTPS'}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </Card>
  )
}

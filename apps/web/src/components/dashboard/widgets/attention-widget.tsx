'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { WidgetCard } from '../widget-card'
import { Button } from '@/components/ui/button'
import { ListSkeleton } from '@/components/shared/list-skeleton'
import { useSiteChecks } from '@/components/infrastructure/use-site-checks'
import { fetchApi } from '@/lib/api'
import { createQueryOptions, queryKeys } from '@/lib/query'
import { buildAttention, countOpenItems } from '@/lib/attention'
import type { ChecklistItem } from '@/lib/checklist'
import { cn } from '@/lib/utils'

const MAX_SHOWN = 5

export function AttentionWidget() {
  const checklist = useQuery(createQueryOptions(queryKeys.checklist, () => fetchApi<ChecklistItem[]>('/checklist')))
  const { projects, sites, health, ssl } = useSiteChecks()

  const now = new Date()
  const items = checklist.data ?? []
  const entries = buildAttention({ items, sites, health: health.data, ssl: ssl.data, now })
  const open = countOpenItems(items, now)
  const loading = checklist.isLoading || projects.isLoading

  return (
    <WidgetCard id="w-attention" type="attention" title="Needs Attention" contentClassName="p-3">
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <ListSkeleton label="Loading items that need attention" rows={3} />
        ) : checklist.error ? (
          <div role="status" className="flex flex-col items-center gap-3 p-3 text-center text-[13px] text-[var(--color-text-2)]">
            <p>Could not load the checklist.</p>
            <Button variant="outline" size="sm" onClick={() => void checklist.refetch()}>Try again</Button>
          </div>
        ) : entries.length === 0 ? (
          <p className="p-3 text-center text-[13px] text-[var(--color-text-2)]">Nothing needs attention.</p>
        ) : (
          <ul className="space-y-2">
            {entries.slice(0, MAX_SHOWN).map((entry) => (
              <li key={entry.key}>
                <Link
                  href={entry.href}
                  className="flex flex-col rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)]/50 p-2 transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  <span className="text-[13px] font-medium text-[var(--color-text)]">{entry.title}</span>
                  <span className={cn('mt-0.5 text-[12px]', entry.tone === 'danger' ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]')}>
                    {entry.detail}
                  </span>
                </Link>
              </li>
            ))}
            {entries.length > MAX_SHOWN && (
              <li className="px-2 text-[12px] text-[var(--color-text-2)]">and {entries.length - MAX_SHOWN} more</li>
            )}
          </ul>
        )}
        {!loading && !checklist.error && open > 0 && (
          <p className="mt-2 px-1 text-[12px] text-[var(--color-text-2)]">
            {open} {open === 1 ? 'checklist item has' : 'checklist items have'} not been checked yet.
          </p>
        )}
      </div>
    </WidgetCard>
  )
}

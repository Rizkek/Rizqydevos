'use client'

import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { IntegrationNotice } from '@/components/shared/integration-notice'
import { ListSkeleton } from '@/components/shared/list-skeleton'

interface GithubPanelProps<T> {
  title: string
  query: UseQueryResult<T[]>
  loadingLabel: string
  emptyText: string
  children: (items: T[]) => ReactNode
}

// Shared frame for the GitHub tabs: one place for the loading, error, and empty states.
export function GithubPanel<T>({ title, query, loadingLabel, emptyText, children }: GithubPanelProps<T>) {
  const { data, isLoading, error, refetch } = query

  return (
    <Card className="flex flex-col h-full bg-[var(--color-surface)] border-[var(--color-border-subtle)] overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border-subtle)] shrink-0">
        <h2 className="font-medium text-[var(--color-text)]">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <ListSkeleton label={loadingLabel} rows={5} />
        ) : error ? (
          <IntegrationNotice error={error} provider="github" onRetry={() => void refetch()} className="h-full" />
        ) : !data || data.length === 0 ? (
          <p className="text-center text-[13px] text-[var(--color-text-2)]">{emptyText}</p>
        ) : (
          children(data)
        )}
      </div>
    </Card>
  )
}

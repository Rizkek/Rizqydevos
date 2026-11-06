import { queryOptions } from '@tanstack/react-query'
import { ApiError } from '@/lib/api'

// A sleeping API (Render free tier) needs tens of seconds to wake up; ordinary errors get one retry.
const WAKE_UP_RETRIES = 5
const MAX_RETRY_DELAY_MS = 15_000

export function isApiUnavailable(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'API_UNAVAILABLE'
}

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isApiUnavailable(error)) return failureCount < WAKE_UP_RETRIES
  if (error instanceof ApiError && error.status === 401) return false
  return failureCount < 1
}

export function retryDelay(attempt: number): number {
  return Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY_MS)
}

export const queryKeys = {
  integrations: ['integrations'] as const,
  projects: ['projects'] as const,
  snippets: ['snippets'] as const,
  notes: ['notes'] as const,
  note: (id: string) => ['note', id] as const,
  scratchpad: ['scratchpad'] as const,
  todos: ['todos'] as const,
  aiPrompts: ['ai-prompts'] as const,
  githubActivity: ['github-activity'] as const,
  githubPullRequests: ['github-pull-requests'] as const,
  githubRepositories: ['github-repositories'] as const,
  vercelDeployments: ['vercel-deployments'] as const,
  sslBatch: (hosts: string[]) => ['ssl-batch', ...hosts] as const,
  healthBatch: (urls: string[]) => ['health-batch', ...urls] as const,
  bookmarks: ['bookmarks'] as const,
  checklist: ['checklist'] as const,
  secrets: ['secrets'] as const,
  auditLogs: ['audit-log'] as const,
} as const

export function createQueryOptions<T>(
  key: readonly unknown[],
  queryFn: () => Promise<T>
) {
  return queryOptions({
    queryKey: key,
    queryFn,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    // Wrapped so TanStack keeps its default error type (Error); passing the unknown-typed
    // function directly widens the query error type and breaks useQuery<T>(...) callers.
    retry: (failureCount, error) => shouldRetryQuery(failureCount, error),
    retryDelay,
  })
}

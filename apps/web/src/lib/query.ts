import { queryOptions } from '@tanstack/react-query'

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
  dockerContainers: ['docker-containers'] as const,
  vercelDeployments: ['vercel-deployments'] as const,
  healthChecks: ['health-checks'] as const,
  sslBatch: (hosts: string[]) => ['ssl-batch', ...hosts] as const,
  healthBatch: (urls: string[]) => ['health-batch', ...urls] as const,
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
    retry: 1,
  })
}

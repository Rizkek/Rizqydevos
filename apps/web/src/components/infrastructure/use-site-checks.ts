'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'
import { createQueryOptions, queryKeys } from '@/lib/query'
import { sitesFromProjects, type HealthResult, type ProjectWithDeployUrl, type SslResult } from '@/lib/sites'

const CHECK_INTERVAL_MS = 60_000

// Uptime and SSL checks for the deploy URLs of the projects. The Infrastructure panel and the dashboard
// share these queries: identical keys mean one request, not two.
export function useSiteChecks() {
  const projects = useQuery(
    createQueryOptions(queryKeys.projects, () => fetchApi<ProjectWithDeployUrl[]>('/projects'))
  )
  const sites = sitesFromProjects(projects.data ?? [])
  const urls = sites.map((site) => site.url)
  const hostnames = sites.filter((site) => site.https).map((site) => site.hostname)

  const health = useQuery({
    ...createQueryOptions(queryKeys.healthBatch(urls), () =>
      fetchApi<HealthResult[]>(`/infrastructure/health/batch?urls=${encodeURIComponent(urls.join(','))}`)),
    enabled: urls.length > 0,
    refetchInterval: CHECK_INTERVAL_MS,
  })
  const ssl = useQuery({
    ...createQueryOptions(queryKeys.sslBatch(hostnames), () =>
      fetchApi<SslResult[]>(`/infrastructure/ssl/batch?hostnames=${encodeURIComponent(hostnames.join(','))}`)),
    enabled: hostnames.length > 0,
    refetchInterval: CHECK_INTERVAL_MS,
  })

  return { projects, sites, health, ssl }
}

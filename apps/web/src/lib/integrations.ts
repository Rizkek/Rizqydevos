import { useQuery } from '@tanstack/react-query'
import { ApiError, fetchApi } from '@/lib/api'
import { createQueryOptions, queryKeys } from '@/lib/query'

export type IntegrationProvider = 'github' | 'vercel'

export const PROVIDER_LABEL: Record<IntegrationProvider, string> = {
  github: 'GitHub',
  vercel: 'Vercel',
}

export interface IntegrationSummary {
  id: string
  provider: IntegrationProvider
  enabled: boolean
  metadata: { accountLogin?: string; teamId?: string }
  updatedAt: string
}

export interface GithubEvent {
  id: string
  type: string | null
  actor: { login: string; avatarUrl: string }
  repo: { name: string; url: string }
  createdAt: string | null
}

export interface VercelDeployment {
  id: string
  name: string
  url: string
  href: string
  state?: string
  environment: string
  createdAt: number
}

// What the user should do next, derived from the API error code.
export type IntegrationIssueKind =
  | 'not-connected'
  | 'disabled'
  | 'reconnect'
  | 'token-rejected'
  | 'rate-limited'
  | 'unavailable'
  | 'unknown'

export interface IntegrationIssue {
  kind: IntegrationIssueKind
  message: string
  retryAfter?: number
  action: 'settings' | 'retry'
}

export function describeIntegrationError(error: unknown, provider: IntegrationProvider): IntegrationIssue {
  const name = PROVIDER_LABEL[provider]

  if (error instanceof ApiError) {
    switch (error.code) {
      case 'INTEGRATION_NOT_CONFIGURED':
        return { kind: 'not-connected', message: `${name} is not connected.`, action: 'settings' }
      case 'INTEGRATION_DISABLED':
        return { kind: 'disabled', message: `The ${name} integration is turned off.`, action: 'settings' }
      case 'TOKEN_UNREADABLE':
        return { kind: 'reconnect', message: `The saved ${name} token can no longer be read. Connect ${name} again.`, action: 'settings' }
      case 'TOKEN_REJECTED':
        return { kind: 'token-rejected', message: `${name} rejected the saved token. Replace it in Settings.`, action: 'settings' }
      case 'RATE_LIMITED':
        return {
          kind: 'rate-limited',
          message: `${name} rate limit reached.`,
          ...(error.retryAfter !== undefined && { retryAfter: error.retryAfter }),
          action: 'retry',
        }
      case 'UPSTREAM_UNAVAILABLE':
        return { kind: 'unavailable', message: `${name} is not responding.`, action: 'retry' }
    }
    return { kind: 'unknown', message: error.message, action: 'retry' }
  }

  // fetch() rejects with TypeError when the DevOS API itself is unreachable.
  if (error instanceof TypeError) {
    return { kind: 'unavailable', message: 'Cannot reach the DevOS API.', action: 'retry' }
  }
  return { kind: 'unknown', message: 'Something went wrong.', action: 'retry' }
}

// Retrying cannot fix a missing or refused token, so only transient failures are retried.
const PERMANENT_CODES = new Set([
  'INTEGRATION_NOT_CONFIGURED',
  'INTEGRATION_DISABLED',
  'TOKEN_UNREADABLE',
  'TOKEN_REJECTED',
  'RATE_LIMITED',
])

export function shouldRetryIntegration(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && (error.status === 401 || (error.code && PERMANENT_CODES.has(error.code)))) return false
  return failureCount < 1
}

function integrationQuery<T>(key: readonly unknown[], endpoint: string) {
  return { ...createQueryOptions(key, () => fetchApi<T>(endpoint)), retry: shouldRetryIntegration }
}

export function useIntegrations() {
  return useQuery(integrationQuery<IntegrationSummary[]>(queryKeys.integrations, '/integrations'))
}

export function useGithubActivity() {
  return useQuery(integrationQuery<GithubEvent[]>(queryKeys.githubActivity, '/integrations/github/activity'))
}

export function useVercelDeployments() {
  return useQuery(integrationQuery<VercelDeployment[]>(queryKeys.vercelDeployments, '/integrations/vercel/deployments'))
}

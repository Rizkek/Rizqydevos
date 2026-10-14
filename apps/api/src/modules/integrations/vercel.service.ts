import { Injectable, Logger } from '@nestjs/common'
import { IntegrationsService } from './integrations.service'
import { IntegrationProvider } from './integration-provider'
import { fromUpstream, UpstreamFailure } from './integration.errors'

const API_URL = 'https://api.vercel.com'
const REQUEST_TIMEOUT_MS = 10_000

interface VercelDeploymentRaw {
  uid: string
  name: string
  url: string
  state?: string
  readyState?: string
  created: number
  target?: string | null
}

export interface VercelDeployment {
  id: string
  name: string
  // Host only, no scheme. The web app still builds `https://${url}`; use `href` for new code.
  url: string
  href: string
  state: string | undefined
  environment: string
  createdAt: number
  // Deprecated alias of `environment`, kept until the web app stops reading it.
  project: string
}

function retryAfterSeconds(headers: Headers, nowSeconds = Math.floor(Date.now() / 1000)): number | undefined {
  const retryAfter = Number(headers.get('retry-after'))
  if (headers.get('retry-after') !== null && Number.isFinite(retryAfter)) return retryAfter
  const reset = Number(headers.get('x-ratelimit-reset'))
  if (headers.get('x-ratelimit-reset') !== null && Number.isFinite(reset)) return Math.max(0, reset - nowSeconds)
  return undefined
}

@Injectable()
export class VercelService {
  private readonly logger = new Logger(VercelService.name)

  constructor(private readonly integrationsService: IntegrationsService) {}

  private async request<T>(token: string, path: string, params: Record<string, string | undefined>): Promise<T> {
    const url = new URL(path, API_URL)
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, value)
    }

    let response: Response
    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      const name = error instanceof Error ? error.name : ''
      const failure: UpstreamFailure = { timedOut: name === 'TimeoutError' || name === 'AbortError' }
      this.logger.warn(`Vercel ${path} request failed (${failure.timedOut ? 'timeout' : 'network'})`)
      throw fromUpstream(IntegrationProvider.Vercel, failure)
    }

    if (!response.ok) {
      this.logger.warn(`Vercel ${path} responded ${response.status}`)
      throw fromUpstream(IntegrationProvider.Vercel, {
        status: response.status,
        retryAfterSeconds: response.status === 429 ? retryAfterSeconds(response.headers) : undefined,
      })
    }

    try {
      return (await response.json()) as T
    } catch {
      throw fromUpstream(IntegrationProvider.Vercel, {})
    }
  }

  // Called before a token is stored. A team id is checked here too, because a wrong one yields an empty list later.
  async verifyToken(token: string, teamId?: string): Promise<{ accountLogin: string; teamId?: string }> {
    const body = await this.request<{ user?: { username?: string } }>(token, '/v2/user', {})
    const accountLogin = body.user?.username
    if (!accountLogin) throw fromUpstream(IntegrationProvider.Vercel, {})

    if (teamId) await this.request(token, '/v6/deployments', { limit: '1', teamId })
    return { accountLogin, ...(teamId && { teamId }) }
  }

  async getDeployments(userId: string, limit = 10): Promise<VercelDeployment[]> {
    const { token, metadata } = await this.integrationsService.getCredentials(userId, IntegrationProvider.Vercel)

    const body = await this.request<{ deployments?: VercelDeploymentRaw[] }>(token, '/v6/deployments', {
      limit: String(limit),
      teamId: metadata.teamId,
    })
    if (!Array.isArray(body.deployments)) throw fromUpstream(IntegrationProvider.Vercel, {})

    return body.deployments.map((dep) => {
      const environment = dep.target ?? 'preview'
      return {
        id: dep.uid,
        name: dep.name,
        url: dep.url,
        href: `https://${dep.url}`,
        state: dep.state ?? dep.readyState,
        environment,
        createdAt: dep.created,
        project: environment,
      }
    })
  }
}

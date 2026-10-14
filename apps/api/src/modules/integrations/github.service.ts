import { Injectable, Logger } from '@nestjs/common'
import { IntegrationsService } from './integrations.service'
import { IntegrationProvider } from './integration-provider'
import { fromUpstream, IntegrationException, UpstreamFailure } from './integration.errors'

type OctokitModule = typeof import('@octokit/rest', { with: { 'resolution-mode': 'import' } })
type OctokitCtor = OctokitModule['Octokit']
type OctokitClient = InstanceType<OctokitCtor>

const REQUEST_TIMEOUT_MS = 10_000

// Octokit 22 has no `request.timeout` option; only an AbortSignal is honoured.
let octokitCtor: Promise<OctokitCtor> | undefined
function loadOctokit(): Promise<OctokitCtor> {
  // Dynamic import because @octokit/rest is ESM-only and this package compiles to CommonJS.
  octokitCtor ??= import('@octokit/rest').then((mod) => mod.Octokit)
  return octokitCtor
}

interface OctokitLikeError {
  status?: number
  name?: string
  response?: { headers?: Record<string, string | number | undefined> }
}

export function githubFailure(error: unknown, nowSeconds = Math.floor(Date.now() / 1000)): UpstreamFailure {
  const { status, name, response } = (error ?? {}) as OctokitLikeError
  const headers = response?.headers ?? {}
  const retryAfter = headers['retry-after'] === undefined ? NaN : Number(headers['retry-after'])
  const reset = headers['x-ratelimit-reset'] === undefined ? NaN : Number(headers['x-ratelimit-reset'])
  const exhausted = String(headers['x-ratelimit-remaining']) === '0'

  // GitHub signals rate limits with 403 (or 429), distinguishable from a real permission error by these headers.
  const rateLimited = status === 429 || (status === 403 && (exhausted || Number.isFinite(retryAfter)))

  let retryAfterSeconds: number | undefined
  if (Number.isFinite(retryAfter)) retryAfterSeconds = retryAfter
  else if (rateLimited && Number.isFinite(reset)) retryAfterSeconds = Math.max(0, reset - nowSeconds)

  return {
    status,
    rateLimited,
    retryAfterSeconds,
    timedOut: name === 'AbortError' || name === 'TimeoutError',
  }
}

export interface GithubEvent {
  id: string
  type: string | null
  actor: { login: string; avatarUrl: string }
  repo: { name: string; url: string }
  createdAt: string | null
}

export interface GithubPullRequest {
  id: number
  title: string
  url: string
  state: string
  repo: { fullName: string; url: string }
  createdAt: string
  updatedAt: string
  author: { login: string | undefined; avatarUrl: string | undefined }
}

export interface GithubRepository {
  id: number
  name: string
  fullName: string
  description: string | null
  private: boolean
  url: string
  language: string | null | undefined
  stargazersCount: number | undefined
  forksCount: number | undefined
  updatedAt: string | null | undefined
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name)

  constructor(private readonly integrationsService: IntegrationsService) {}

  private async createClient(token: string): Promise<OctokitClient> {
    const Octokit = await loadOctokit()
    return new Octokit({
      auth: token,
      request: { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    })
  }

  private async run<T>(
    userId: string,
    operation: string,
    fn: (octokit: OctokitClient, accountLogin: string | undefined) => Promise<T>,
  ): Promise<T> {
    // Credential errors (not connected, disabled, unreadable) are already typed and propagate unchanged.
    const { token, metadata } = await this.integrationsService.getCredentials(userId, IntegrationProvider.Github)
    const octokit = await this.createClient(token)

    try {
      return await fn(octokit, metadata.accountLogin)
    } catch (error) {
      if (error instanceof IntegrationException) throw error
      const failure = githubFailure(error)
      // Never log the error object: Octokit errors can carry request headers.
      this.logger.warn(`GitHub ${operation} failed (status=${failure.status ?? 'none'}, rateLimited=${failure.rateLimited})`)
      throw fromUpstream(IntegrationProvider.Github, failure)
    }
  }

  // Called before a token is stored. Any non-typed failure is mapped like a normal request.
  async verifyToken(token: string): Promise<{ accountLogin: string }> {
    const octokit = await this.createClient(token)
    try {
      const { data } = await octokit.users.getAuthenticated()
      return { accountLogin: data.login }
    } catch (error) {
      const failure = githubFailure(error)
      this.logger.warn(`GitHub token verification failed (status=${failure.status ?? 'none'})`)
      throw fromUpstream(IntegrationProvider.Github, failure)
    }
  }

  getActivityFeed(userId: string): Promise<GithubEvent[]> {
    return this.run(userId, 'activity', async (octokit, savedLogin) => {
      // Rows connected before verification existed have no saved login.
      const username = savedLogin ?? (await octokit.users.getAuthenticated()).data.login
      const { data } = await octokit.activity.listEventsForAuthenticatedUser({ username, per_page: 20 })

      return data.map((event) => ({
        id: event.id,
        type: event.type,
        actor: { login: event.actor.login, avatarUrl: event.actor.avatar_url },
        repo: { name: event.repo.name, url: `https://github.com/${event.repo.name}` },
        createdAt: event.created_at,
      }))
    })
  }

  getPullRequests(userId: string): Promise<GithubPullRequest[]> {
    return this.run(userId, 'pull requests', async (octokit) => {
      const { data } = await octokit.search.issuesAndPullRequests({
        q: 'is:pr is:open involves:@me',
        per_page: 10,
      })

      return data.items.map((item) => {
        // repository_url is an API URL (https://api.github.com/repos/owner/name).
        const fullName = item.repository_url.split('/repos/')[1] ?? item.repository_url
        return {
          id: item.id,
          title: item.title,
          url: item.html_url,
          state: item.state,
          repo: { fullName, url: `https://github.com/${fullName}` },
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          author: { login: item.user?.login, avatarUrl: item.user?.avatar_url },
        }
      })
    })
  }

  getRepositories(userId: string): Promise<GithubRepository[]> {
    return this.run(userId, 'repositories', async (octokit) => {
      const { data } = await octokit.repos.listForAuthenticatedUser({ sort: 'pushed', per_page: 20 })

      return data.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        url: repo.html_url,
        language: repo.language,
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        updatedAt: repo.updated_at,
      }))
    })
  }
}

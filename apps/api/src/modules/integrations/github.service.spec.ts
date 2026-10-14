import { HttpStatus } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GithubService, githubFailure } from './github.service'
import { IntegrationException, notConfigured } from './integration.errors'
import { IntegrationProvider } from './integration-provider'

const mocks = vi.hoisted(() => ({
  ctor: vi.fn(),
  octokit: {
    users: { getAuthenticated: vi.fn() },
    activity: { listEventsForAuthenticatedUser: vi.fn() },
    search: { issuesAndPullRequests: vi.fn() },
    repos: { listForAuthenticatedUser: vi.fn() },
  },
}))

vi.mock('@octokit/rest', () => ({
  Octokit: class {
    constructor(options: unknown) {
      mocks.ctor(options)
      return mocks.octokit
    }
  },
}))

const httpError = (status: number, headers: Record<string, string> = {}) =>
  Object.assign(new Error('boom'), { status, response: { headers } })

async function caught(promise: Promise<unknown>): Promise<IntegrationException> {
  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(IntegrationException)
    return error as IntegrationException
  }
  throw new Error('expected the promise to reject')
}

describe('githubFailure', () => {
  const now = 1_000

  it('treats 403 with an exhausted quota as rate limited and derives retryAfter from the reset time', () => {
    const failure = githubFailure(httpError(403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1060' }), now)
    expect(failure.rateLimited).toBe(true)
    expect(failure.retryAfterSeconds).toBe(60)
  })

  it('treats 403 with Retry-After (secondary limit) as rate limited', () => {
    const failure = githubFailure(httpError(403, { 'retry-after': '25' }), now)
    expect(failure.rateLimited).toBe(true)
    expect(failure.retryAfterSeconds).toBe(25)
  })

  it('does not treat a plain 403 as rate limited', () => {
    expect(githubFailure(httpError(403, { 'x-ratelimit-remaining': '4000' }), now).rateLimited).toBe(false)
  })

  it('flags aborted and timed out requests', () => {
    expect(githubFailure(Object.assign(new Error('t'), { name: 'TimeoutError' })).timedOut).toBe(true)
    expect(githubFailure(Object.assign(new Error('a'), { name: 'AbortError' })).timedOut).toBe(true)
  })

  it('tolerates non-object errors', () => {
    expect(githubFailure(undefined)).toMatchObject({ rateLimited: false })
    expect(githubFailure('oops')).toMatchObject({ rateLimited: false })
  })
})

describe('GithubService', () => {
  let integrations: { getCredentials: ReturnType<typeof vi.fn> }
  let service: GithubService

  beforeEach(() => {
    vi.clearAllMocks()
    integrations = { getCredentials: vi.fn().mockResolvedValue({ token: 'test-token', metadata: { accountLogin: 'octo' } }) }
    service = new GithubService(integrations as never)
  })

  it('propagates credential errors unchanged', async () => {
    integrations.getCredentials.mockRejectedValue(notConfigured(IntegrationProvider.Github))
    const error = await caught(service.getRepositories('u1'))
    expect(error.code).toBe('INTEGRATION_NOT_CONFIGURED')
  })

  it('gives every client a bounded request via an abort signal, not the ignored timeout option', async () => {
    mocks.octokit.repos.listForAuthenticatedUser.mockResolvedValue({ data: [] })
    await service.getRepositories('u1')
    const options = mocks.ctor.mock.calls[0]![0] as { auth: string; request: { signal: unknown; timeout?: unknown } }
    expect(options.auth).toBe('test-token')
    expect(options.request.signal).toBeInstanceOf(AbortSignal)
    expect(options.request.timeout).toBeUndefined()
  })

  it.each([
    [401, 'TOKEN_REJECTED', HttpStatus.FAILED_DEPENDENCY],
    [500, 'UPSTREAM_UNAVAILABLE', HttpStatus.BAD_GATEWAY],
    [429, 'RATE_LIMITED', HttpStatus.TOO_MANY_REQUESTS],
  ])('maps a GitHub %i to %s without ever using 401', async (status, code, httpStatus) => {
    mocks.octokit.repos.listForAuthenticatedUser.mockRejectedValue(httpError(status))
    const error = await caught(service.getRepositories('u1'))
    expect(error.code).toBe(code)
    expect(error.getStatus()).toBe(httpStatus)
  })

  it('reports rate limit with retryAfter from headers', async () => {
    mocks.octokit.repos.listForAuthenticatedUser.mockRejectedValue(httpError(403, { 'retry-after': '42' }))
    const error = await caught(service.getRepositories('u1'))
    expect(error.code).toBe('RATE_LIMITED')
    expect(error.retryAfterSeconds).toBe(42)
  })

  it('maps a network failure with no status to UPSTREAM_UNAVAILABLE', async () => {
    mocks.octokit.repos.listForAuthenticatedUser.mockRejectedValue(new TypeError('fetch failed'))
    expect((await caught(service.getRepositories('u1'))).code).toBe('UPSTREAM_UNAVAILABLE')
  })

  it('does not leak the token in the error message', async () => {
    mocks.octokit.repos.listForAuthenticatedUser.mockRejectedValue(httpError(401))
    const error = await caught(service.getRepositories('u1'))
    expect(JSON.stringify(error.getResponse())).not.toContain('test-token')
  })

  describe('activity', () => {
    const event = {
      id: '1',
      type: 'PushEvent',
      actor: { login: 'octo', avatar_url: 'https://a/x.png' },
      repo: { name: 'octo/repo' },
      created_at: '2026-10-01T00:00:00Z',
      payload: { big: 'object' },
    }

    it('uses the saved login and skips the extra /user call', async () => {
      mocks.octokit.activity.listEventsForAuthenticatedUser.mockResolvedValue({ data: [event] })
      const result = await service.getActivityFeed('u1')
      expect(mocks.octokit.users.getAuthenticated).not.toHaveBeenCalled()
      expect(mocks.octokit.activity.listEventsForAuthenticatedUser).toHaveBeenCalledWith({ username: 'octo', per_page: 20 })
      expect(result).toEqual([
        {
          id: '1',
          type: 'PushEvent',
          actor: { login: 'octo', avatarUrl: 'https://a/x.png' },
          repo: { name: 'octo/repo', url: 'https://github.com/octo/repo' },
          createdAt: '2026-10-01T00:00:00Z',
        },
      ])
    })

    it('falls back to /user for rows connected before the login was saved', async () => {
      integrations.getCredentials.mockResolvedValue({ token: 'test-token', metadata: {} })
      mocks.octokit.users.getAuthenticated.mockResolvedValue({ data: { login: 'legacy' } })
      mocks.octokit.activity.listEventsForAuthenticatedUser.mockResolvedValue({ data: [] })
      await service.getActivityFeed('u1')
      expect(mocks.octokit.activity.listEventsForAuthenticatedUser).toHaveBeenCalledWith({ username: 'legacy', per_page: 20 })
    })
  })

  it('turns the API repository_url of a pull request into a repo name and web link', async () => {
    mocks.octokit.search.issuesAndPullRequests.mockResolvedValue({
      data: {
        items: [
          {
            id: 7,
            title: 'Fix',
            html_url: 'https://github.com/octo/repo/pull/7',
            state: 'open',
            repository_url: 'https://api.github.com/repos/octo/repo',
            created_at: 'a',
            updated_at: 'b',
            user: { login: 'octo', avatar_url: 'u' },
          },
        ],
      },
    })
    const [pr] = await service.getPullRequests('u1')
    expect(pr!.repo).toEqual({ fullName: 'octo/repo', url: 'https://github.com/octo/repo' })
  })

  describe('verifyToken', () => {
    it('returns the account login for a valid token', async () => {
      mocks.octokit.users.getAuthenticated.mockResolvedValue({ data: { login: 'octo' } })
      await expect(service.verifyToken('candidate')).resolves.toEqual({ accountLogin: 'octo' })
      expect((mocks.ctor.mock.calls[0]![0] as { auth: string }).auth).toBe('candidate')
    })

    it('reports TOKEN_REJECTED for a bad token', async () => {
      mocks.octokit.users.getAuthenticated.mockRejectedValue(httpError(401))
      expect((await caught(service.verifyToken('bad'))).code).toBe('TOKEN_REJECTED')
    })
  })
})

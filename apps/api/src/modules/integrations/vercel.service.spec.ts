import { HttpStatus } from '@nestjs/common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { IntegrationProvider } from './integration-provider'
import { IntegrationException, notConfigured } from './integration.errors'
import { VercelService } from './vercel.service'

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' }, ...init })

async function caught(promise: Promise<unknown>): Promise<IntegrationException> {
  try {
    await promise
  } catch (error) {
    expect(error).toBeInstanceOf(IntegrationException)
    return error as IntegrationException
  }
  throw new Error('expected the promise to reject')
}

describe('VercelService', () => {
  let integrations: { getCredentials: ReturnType<typeof vi.fn> }
  let service: VercelService
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    integrations = { getCredentials: vi.fn().mockResolvedValue({ token: 'test-token', metadata: {} }) }
    service = new VercelService(integrations as never)
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('propagates credential errors unchanged', async () => {
    integrations.getCredentials.mockRejectedValue(notConfigured(IntegrationProvider.Vercel))
    expect((await caught(service.getDeployments('u1'))).code).toBe('INTEGRATION_NOT_CONFIGURED')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    [401, 'TOKEN_REJECTED', HttpStatus.FAILED_DEPENDENCY],
    [403, 'TOKEN_REJECTED', HttpStatus.FAILED_DEPENDENCY],
    [500, 'UPSTREAM_UNAVAILABLE', HttpStatus.BAD_GATEWAY],
  ])('maps a Vercel %i to %s without using 401', async (status, code, httpStatus) => {
    fetchMock.mockResolvedValue(new Response('{}', { status }))
    const error = await caught(service.getDeployments('u1'))
    expect(error.code).toBe(code)
    expect(error.getStatus()).toBe(httpStatus)
  })

  it('reports rate limiting with the Retry-After value', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 429, headers: { 'retry-after': '17' } }))
    const error = await caught(service.getDeployments('u1'))
    expect(error.code).toBe('RATE_LIMITED')
    expect(error.retryAfterSeconds).toBe(17)
  })

  it('maps a timeout to 504 and other network errors to 502', async () => {
    fetchMock.mockRejectedValueOnce(Object.assign(new Error('t'), { name: 'TimeoutError' }))
    expect((await caught(service.getDeployments('u1'))).getStatus()).toBe(HttpStatus.GATEWAY_TIMEOUT)
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))
    expect((await caught(service.getDeployments('u1'))).getStatus()).toBe(HttpStatus.BAD_GATEWAY)
  })

  it('treats malformed JSON and an unexpected body shape as upstream failures', async () => {
    fetchMock.mockResolvedValueOnce(new Response('not json', { status: 200 }))
    expect((await caught(service.getDeployments('u1'))).code).toBe('UPSTREAM_UNAVAILABLE')
    fetchMock.mockResolvedValueOnce(json({ unexpected: true }))
    expect((await caught(service.getDeployments('u1'))).code).toBe('UPSTREAM_UNAVAILABLE')
  })

  it('maps deployments and keeps the fields the web app still reads', async () => {
    fetchMock.mockResolvedValue(
      json({
        deployments: [
          { uid: 'd1', name: 'app', url: 'app.vercel.app', state: 'READY', created: 123, target: 'production' },
          { uid: 'd2', name: 'app', url: 'app-git.vercel.app', readyState: 'BUILDING', created: 124, target: null },
        ],
      }),
    )
    const result = await service.getDeployments('u1')
    expect(result[0]).toEqual({
      id: 'd1',
      name: 'app',
      url: 'app.vercel.app',
      href: 'https://app.vercel.app',
      state: 'READY',
      environment: 'production',
      createdAt: 123,
      project: 'production',
    })
    expect(result[1]).toMatchObject({ state: 'BUILDING', environment: 'preview', project: 'preview' })
  })

  it('sends the token as a bearer header and scopes the request to the saved team and limit', async () => {
    integrations.getCredentials.mockResolvedValue({ token: 'test-token', metadata: { teamId: 'team_abc' } })
    fetchMock.mockResolvedValue(json({ deployments: [] }))
    await service.getDeployments('u1', 25)

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(url.pathname).toBe('/v6/deployments')
    expect(url.searchParams.get('teamId')).toBe('team_abc')
    expect(url.searchParams.get('limit')).toBe('25')
    expect((init.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('omits teamId for personal accounts', async () => {
    fetchMock.mockResolvedValue(json({ deployments: [] }))
    await service.getDeployments('u1')
    expect((fetchMock.mock.calls[0]![0] as URL).searchParams.has('teamId')).toBe(false)
  })

  describe('verifyToken', () => {
    it('returns the account username', async () => {
      fetchMock.mockResolvedValue(json({ user: { username: 'octo' } }))
      await expect(service.verifyToken('candidate')).resolves.toEqual({ accountLogin: 'octo' })
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('also checks access to the requested team', async () => {
      fetchMock.mockResolvedValueOnce(json({ user: { username: 'octo' } })).mockResolvedValueOnce(json({ deployments: [] }))
      await expect(service.verifyToken('candidate', 'team_abc')).resolves.toEqual({ accountLogin: 'octo', teamId: 'team_abc' })
      expect((fetchMock.mock.calls[1]![0] as URL).searchParams.get('teamId')).toBe('team_abc')
    })

    it('fails when the team is not accessible', async () => {
      fetchMock.mockResolvedValueOnce(json({ user: { username: 'octo' } })).mockResolvedValueOnce(new Response('{}', { status: 403 }))
      expect((await caught(service.verifyToken('candidate', 'team_nope'))).code).toBe('TOKEN_REJECTED')
    })

    it('reports TOKEN_REJECTED for a bad token', async () => {
      fetchMock.mockResolvedValue(new Response('{}', { status: 401 }))
      expect((await caught(service.verifyToken('bad'))).code).toBe('TOKEN_REJECTED')
    })
  })
})

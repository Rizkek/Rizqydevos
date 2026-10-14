import { ExecutionContext, HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { GlobalExceptionFilter } from '../../shared/filters/global-exception.filter'
import { AuthGuard } from '../../shared/guards/auth.guard'
import { ResponseTransformInterceptor } from '../../shared/interceptors/response-transform.interceptor'
import { GithubService } from './github.service'
import { IntegrationConnectionService } from './integration-connection.service'
import { IntegrationException } from './integration.errors'
import { IntegrationsController } from './integrations.controller'
import { IntegrationsService } from './integrations.service'
import { VercelService } from './vercel.service'

const summary = { id: 'i1', provider: 'github', enabled: true, metadata: { accountLogin: 'octo' }, updatedAt: '2026-10-14T00:00:00.000Z' }

// Same pipeline as main.ts, so the contract tested here is the one the web app sees.
describe('Integrations HTTP contract', () => {
  let app: INestApplication
  let base: string
  const integrations = { list: vi.fn() }
  const connection = { connect: vi.fn(), setEnabled: vi.fn(), disconnect: vi.fn() }
  const github = { getActivityFeed: vi.fn(), getPullRequests: vi.fn(), getRepositories: vi.fn() }
  const vercel = { getDeployments: vi.fn() }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [IntegrationsController],
      providers: [
        { provide: IntegrationsService, useValue: integrations },
        { provide: IntegrationConnectionService, useValue: connection },
        { provide: GithubService, useValue: github },
        { provide: VercelService, useValue: vercel },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          context.switchToHttp().getRequest().user = { id: 'user-1' }
          return true
        },
      })
      .compile()

    app = moduleRef.createNestApplication({ logger: false })
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }),
    )
    app.useGlobalFilters(new GlobalExceptionFilter())
    app.useGlobalInterceptors(new ResponseTransformInterceptor())
    app.setGlobalPrefix('api/v1')
    await app.listen(0)
    base = `${await app.getUrl()}/api/v1/integrations`.replace('[::1]', 'localhost')
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const send = (path: string, init: RequestInit = {}) =>
    fetch(`${base}${path}`, { headers: { 'content-type': 'application/json' }, ...init })

  interface Envelope {
    data?: unknown
    error?: { code: string; message?: string; retryAfter?: number }
  }
  const read = async (res: Response) => (await res.json()) as Envelope

  describe('provider whitelist', () => {
    it.each(['POST', 'PATCH', 'DELETE'])('rejects an unknown provider on %s with 400 and does not reach the service', async (method) => {
      const res = await send('/anything', method === 'DELETE' ? { method } : { method, body: JSON.stringify({ accessToken: 't', enabled: true }) })
      expect(res.status).toBe(400)
      expect(connection.connect).not.toHaveBeenCalled()
      expect(connection.setEnabled).not.toHaveBeenCalled()
      expect(connection.disconnect).not.toHaveBeenCalled()
    })
  })

  describe('POST /:provider', () => {
    it('trims the token and returns the summary', async () => {
      connection.connect.mockResolvedValue(summary)
      const res = await send('/github', { method: 'POST', body: JSON.stringify({ accessToken: '  tok  ' }) })
      expect(res.status).toBe(200)
      expect((await read(res)).data).toMatchObject({ id: 'i1', provider: 'github' })
      expect(connection.connect).toHaveBeenCalledWith('user-1', 'github', expect.objectContaining({ accessToken: 'tok' }))
    })

    it.each([
      ['an empty token', { accessToken: '' }],
      ['a whitespace token', { accessToken: '   ' }],
      ['a missing token', {}],
      ['an oversized token', { accessToken: 'x'.repeat(513) }],
      ['a client-chosen provider field', { accessToken: 't', provider: 'github' }],
      ['unexpected properties', { accessToken: 't', refreshToken: 'r' }],
      ['an invalid teamId', { accessToken: 't', teamId: 'team/../x' }],
    ])('rejects %s with 400 VALIDATION_ERROR', async (_label, body) => {
      const res = await send('/vercel', { method: 'POST', body: JSON.stringify(body) })
      expect(res.status).toBe(400)
      expect((await read(res)).error?.code).toBe('VALIDATION_ERROR')
      expect(connection.connect).not.toHaveBeenCalled()
    })

    it('surfaces a refused token as 422 INTEGRATION_TOKEN_INVALID', async () => {
      connection.connect.mockRejectedValue(new IntegrationException(HttpStatus.UNPROCESSABLE_ENTITY, 'INTEGRATION_TOKEN_INVALID', 'nope'))
      const res = await send('/github', { method: 'POST', body: JSON.stringify({ accessToken: 'bad' }) })
      expect(res.status).toBe(422)
      expect((await read(res)).error).toMatchObject({ code: 'INTEGRATION_TOKEN_INVALID', message: 'nope' })
    })
  })

  describe('PATCH /:provider', () => {
    it('toggles enabled', async () => {
      connection.setEnabled.mockResolvedValue({ ...summary, enabled: false })
      const res = await send('/github', { method: 'PATCH', body: JSON.stringify({ enabled: false }) })
      expect(res.status).toBe(200)
      expect(connection.setEnabled).toHaveBeenCalledWith('user-1', 'github', false)
    })

    it.each([['a string "false"', { enabled: 'false' }], ['a missing value', {}], ['extra fields', { enabled: true, provider: 'x' }]])(
      'rejects %s',
      async (_label, body) => {
        const res = await send('/github', { method: 'PATCH', body: JSON.stringify(body) })
        expect(res.status).toBe(400)
        expect(connection.setEnabled).not.toHaveBeenCalled()
      },
    )
  })

  describe('DELETE /:provider', () => {
    it('returns 204 every time, so disconnecting twice is fine', async () => {
      connection.disconnect.mockResolvedValue(undefined)
      expect((await send('/github', { method: 'DELETE' })).status).toBe(204)
      expect((await send('/github', { method: 'DELETE' })).status).toBe(204)
      expect(connection.disconnect).toHaveBeenCalledTimes(2)
    })
  })

  describe('GET /', () => {
    it('returns summaries wrapped in the success envelope', async () => {
      integrations.list.mockResolvedValue([summary])
      const res = await send('')
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ success: true, data: [summary] })
    })
  })

  describe('upstream failure contract', () => {
    it('never answers 401 for a rejected provider token', async () => {
      github.getActivityFeed.mockRejectedValue(new IntegrationException(HttpStatus.FAILED_DEPENDENCY, 'TOKEN_REJECTED', 'GitHub rejected the token'))
      const res = await send('/github/activity')
      expect(res.status).toBe(424)
      expect((await read(res)).error?.code).toBe('TOKEN_REJECTED')
    })

    it('adds Retry-After header and body field for rate limits', async () => {
      vercel.getDeployments.mockRejectedValue(new IntegrationException(HttpStatus.TOO_MANY_REQUESTS, 'RATE_LIMITED', 'slow down', 30))
      const res = await send('/vercel/deployments')
      expect(res.status).toBe(429)
      expect(res.headers.get('retry-after')).toBe('30')
      expect((await read(res)).error).toMatchObject({ code: 'RATE_LIMITED', retryAfter: 30 })
    })

    it('reports a not-connected integration as 404 INTEGRATION_NOT_CONFIGURED', async () => {
      github.getRepositories.mockRejectedValue(new IntegrationException(HttpStatus.NOT_FOUND, 'INTEGRATION_NOT_CONFIGURED', 'GitHub is not connected'))
      const res = await send('/github/repos')
      expect(res.status).toBe(404)
      expect((await read(res)).error?.code).toBe('INTEGRATION_NOT_CONFIGURED')
    })

    it('leaves unexpected bugs as 500, not as an auth error', async () => {
      github.getPullRequests.mockRejectedValue(new TypeError('bug'))
      const res = await send('/github/prs')
      expect(res.status).toBe(500)
    })
  })

  describe('GET /vercel/deployments limit', () => {
    it('defaults to 10 and accepts up to 50', async () => {
      vercel.getDeployments.mockResolvedValue([])
      await send('/vercel/deployments')
      await send('/vercel/deployments?limit=50')
      expect(vercel.getDeployments).toHaveBeenNthCalledWith(1, 'user-1', 10)
      expect(vercel.getDeployments).toHaveBeenNthCalledWith(2, 'user-1', 50)
    })

    it.each(['0', '51', 'abc', '1.5'])('rejects limit=%s', async (limit) => {
      const res = await send(`/vercel/deployments?limit=${limit}`)
      expect(res.status).toBe(400)
      expect(vercel.getDeployments).not.toHaveBeenCalled()
    })
  })
})

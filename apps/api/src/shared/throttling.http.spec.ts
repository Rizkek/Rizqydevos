import { Controller, Get, INestApplication, Post } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { SkipThrottle, Throttle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { Test } from '@nestjs/testing'
import { afterEach, describe, expect, it } from 'vitest'
import { GlobalExceptionFilter } from './filters/global-exception.filter'

@Controller()
class ProbeController {
  @Get('data')
  data() {
    return { ok: true }
  }

  @Post('connect')
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  connect() {
    return { ok: true }
  }

  @SkipThrottle()
  @Get('health')
  health() {
    return { status: 'ok' }
  }
}

// Mirrors app.module.ts (global ThrottlerGuard) and main.ts (trust proxy, exception filter).
async function start(trustProxyHops: number, limit = 3) {
  const moduleRef = await Test.createTestingModule({
    imports: [ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit }])],
    controllers: [ProbeController],
    providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  }).compile()

  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false })
  app.set('trust proxy', trustProxyHops)
  app.useGlobalFilters(new GlobalExceptionFilter())
  await app.listen(0)
  const base = (await app.getUrl()).replace('[::1]', 'localhost')
  return { app, base }
}

describe('request throttling', () => {
  let app: INestApplication | undefined

  afterEach(async () => {
    await app?.close()
    app = undefined
  })

  const get = (url: string, headers: Record<string, string> = {}) => fetch(url, { headers })

  it('answers 429 RATE_LIMITED with Retry-After once the limit is exceeded', async () => {
    const started = await start(0)
    app = started.app

    for (let i = 0; i < 3; i++) expect((await get(`${started.base}/data`)).status).toBe(200)
    const blocked = await get(`${started.base}/data`)

    expect(blocked.status).toBe(429)
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0)
    expect(await blocked.json()).toMatchObject({ success: false, error: { code: 'RATE_LIMITED' } })
  })

  it('never throttles routes marked SkipThrottle (health probes)', async () => {
    const started = await start(0, 1)
    app = started.app

    for (let i = 0; i < 10; i++) expect((await get(`${started.base}/health`)).status).toBe(200)
  })

  it('applies a tighter per-route limit than the global one', async () => {
    const started = await start(0, 100)
    app = started.app
    const post = () => fetch(`${started.base}/connect`, { method: 'POST' })

    expect((await post()).status).toBe(201)
    expect((await post()).status).toBe(201)
    expect((await post()).status).toBe(429)
    expect((await get(`${started.base}/data`)).status).toBe(200)
  })

  describe('client identity behind a proxy', () => {
    it('with 0 hops ignores X-Forwarded-For, so a spoofed header cannot dodge the limit', async () => {
      const started = await start(0, 2)
      app = started.app

      expect((await get(`${started.base}/data`, { 'x-forwarded-for': '1.1.1.1' })).status).toBe(200)
      expect((await get(`${started.base}/data`, { 'x-forwarded-for': '2.2.2.2' })).status).toBe(200)
      expect((await get(`${started.base}/data`, { 'x-forwarded-for': '3.3.3.3' })).status).toBe(429)
    })

    it('with 1 hop counts each forwarded client separately', async () => {
      const started = await start(1, 2)
      app = started.app

      for (let i = 0; i < 2; i++) expect((await get(`${started.base}/data`, { 'x-forwarded-for': '1.1.1.1' })).status).toBe(200)
      expect((await get(`${started.base}/data`, { 'x-forwarded-for': '1.1.1.1' })).status).toBe(429)
      // A different client behind the same proxy is unaffected.
      expect((await get(`${started.base}/data`, { 'x-forwarded-for': '9.9.9.9' })).status).toBe(200)
    })

    it('with 1 hop trusts only the entry the proxy appended, not a client-supplied prefix', async () => {
      const started = await start(1, 2)
      app = started.app

      // The proxy appends the real client (7.7.7.7); everything before it is attacker-controlled.
      const spoofed = (n: number) => ({ 'x-forwarded-for': `10.0.0.${n}, 7.7.7.7` })
      expect((await get(`${started.base}/data`, spoofed(1))).status).toBe(200)
      expect((await get(`${started.base}/data`, spoofed(2))).status).toBe(200)
      expect((await get(`${started.base}/data`, spoofed(3))).status).toBe(429)
    })
  })
})

import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from './auth.guard'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('AuthGuard', () => {
  let guard: AuthGuard
  let reflector: Reflector

  beforeEach(() => {
    reflector = new Reflector()
    guard = new AuthGuard(reflector)
    process.env.BETTER_AUTH_URL = 'http://localhost:3000'
  })

  const mockExecutionContext = (headers: Record<string, string>): ExecutionContext => {
    return {
      getHandler: () => vi.fn(),
      getClass: () => vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ headers, method: 'GET', url: '/test' }),
      }),
    } as unknown as ExecutionContext
  }

  it('should allow access if route is public', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true)
    const context = mockExecutionContext({})
    expect(await guard.canActivate(context)).toBe(true)
  })

  it('should throw UnauthorizedException if cookie is missing', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)
    const context = mockExecutionContext({})
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
  })

  it('should throw UnauthorizedException if session verification fails', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)
    const context = mockExecutionContext({ cookie: 'session=123' })
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    })

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException)
  })

  it('should authenticate user and attach to request if valid', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)
    const req = { headers: { cookie: 'session=123' }, method: 'GET', url: '/test' }
    const context = {
      getHandler: () => vi.fn(),
      getClass: () => vi.fn(),
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ session: { id: 's1' }, user: { id: 'u1' } }),
    })

    const result = await guard.canActivate(context)
    expect(result).toBe(true)
    expect((req as { user?: unknown }).user).toEqual({ id: 'u1' })
  })

  it('keeps the session id and sign-in time, which vault actions check for a recent sign-in', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)
    const req = { headers: { cookie: 'session=123' }, method: 'GET', url: '/test' }
    const context = {
      getHandler: () => vi.fn(),
      getClass: () => vi.fn(),
      switchToHttp: () => ({ getRequest: () => req }),
    } as unknown as ExecutionContext

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ session: { id: 's1', createdAt: '2026-11-01T10:00:00.000Z', token: 'test-token' }, user: { id: 'u1' } }),
    })

    await guard.canActivate(context)
    expect((req as { session?: unknown }).session).toEqual({ id: 's1', createdAt: '2026-11-01T10:00:00.000Z' })
  })

  describe('verified session cache', () => {
    const contextFor = (cookie: string) => {
      const req: { headers: { cookie: string }; method: string; url: string; user?: unknown } = { headers: { cookie }, method: 'GET', url: '/test' }
      return { req, context: { getHandler: () => vi.fn(), getClass: () => vi.fn(), switchToHttp: () => ({ getRequest: () => req }) } as unknown as ExecutionContext }
    }
    const valid = () => vi.fn().mockResolvedValue({ ok: true, json: async () => ({ session: { id: 's1' }, user: { id: 'u1' } }) })

    beforeEach(() => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false)
    })

    it('asks the web app once for several requests with the same cookie', async () => {
      const fetchMock = valid()
      global.fetch = fetchMock
      for (let i = 0; i < 3; i++) {
        const { req, context } = contextFor('session=abc')
        await expect(guard.canActivate(context)).resolves.toBe(true)
        expect(req.user).toEqual({ id: 'u1' })
      }
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('verifies another cookie separately', async () => {
      const fetchMock = valid()
      global.fetch = fetchMock
      await guard.canActivate(contextFor('session=abc').context)
      await guard.canActivate(contextFor('session=def').context)
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('does not remember a rejected session, so signing in afterwards works at once', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false })
      await expect(guard.canActivate(contextFor('session=abc').context)).rejects.toThrow(UnauthorizedException)

      const fetchMock = valid()
      global.fetch = fetchMock
      await expect(guard.canActivate(contextFor('session=abc').context)).resolves.toBe(true)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('rejects the empty answer Better Auth gives when there is no session', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => null })
      await expect(guard.canActivate(contextFor('session=abc').context)).rejects.toThrow(UnauthorizedException)
    })
  })
})
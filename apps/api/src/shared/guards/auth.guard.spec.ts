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

  const mockExecutionContext = (headers: Record<string, string>, isPublic = false): ExecutionContext => {
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
    expect((req as any).user).toEqual({ id: 'u1' })
  })
})
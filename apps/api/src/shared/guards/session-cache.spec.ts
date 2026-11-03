import { describe, expect, it } from 'vitest'
import { SessionCache, type CachedSession } from './session-cache'

const session = (id: string): CachedSession => ({ user: { id: `user-${id}` }, session: { id } })

describe('SessionCache', () => {
  it('returns a stored session until it expires', () => {
    let now = 1_000
    const cache = new SessionCache(30_000, 50, () => now)
    cache.set('cookie-a', session('a'))

    expect(cache.get('cookie-a')).toEqual(session('a'))
    now += 29_999
    expect(cache.get('cookie-a')).toEqual(session('a'))
    now += 1
    expect(cache.get('cookie-a')).toBeUndefined()
    expect(cache.size).toBe(0)
  })

  it('keeps different cookies apart', () => {
    const cache = new SessionCache()
    cache.set('cookie-a', session('a'))
    expect(cache.get('cookie-b')).toBeUndefined()
  })

  it('drops the oldest entry when full', () => {
    const cache = new SessionCache(30_000, 2)
    cache.set('c1', session('1'))
    cache.set('c2', session('2'))
    cache.set('c3', session('3'))

    expect(cache.size).toBe(2)
    expect(cache.get('c1')).toBeUndefined()
    expect(cache.get('c2')).toBeDefined()
    expect(cache.get('c3')).toBeDefined()
  })

  it('does not keep the raw cookie in memory', () => {
    const cache = new SessionCache()
    cache.set('better-auth.session_token=very-secret-token', session('a'))
    const keys = [...(cache as unknown as { entries: Map<string, unknown> }).entries.keys()]
    expect(keys).toHaveLength(1)
    expect(keys[0]).toMatch(/^[0-9a-f]{64}$/)
    expect(keys[0]).not.toContain('very-secret-token')
  })
})

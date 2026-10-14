import { describe, expect, it } from 'vitest'
import { getRedirectUrl, isPublicPath, safeRedirectPath } from './auth-guard'

describe('safeRedirectPath', () => {
  it.each(['/', '/projects', '/projects?tab=a&b=2', '/knowledge/notes/abc', '/settings#integrations'])('allows %s', (path) => {
    expect(safeRedirectPath(path)).toBe(path)
  })

  it.each([
    ['https://evil.example', 'absolute URL'],
    ['//evil.example', 'protocol-relative URL'],
    ['/\\evil.example', 'backslash authority'],
    ['javascript:alert(1)', 'script URL'],
    ['evil', 'relative path'],
    ['/path\nwith-newline', 'control characters'],
    ['/login', 'login page itself'],
    ['/login?redirectTo=/x', 'login with parameters'],
    ['', 'empty string'],
  ])('falls back for %s (%s)', (value) => {
    expect(safeRedirectPath(value)).toBe('/')
  })

  it('falls back for null and undefined', () => {
    expect(safeRedirectPath(null)).toBe('/')
    expect(safeRedirectPath(undefined)).toBe('/')
  })

  it('uses the supplied fallback', () => {
    expect(safeRedirectPath('//evil.example', '/projects')).toBe('/projects')
  })
})

describe('getRedirectUrl', () => {
  it('keeps the original query string exactly once', () => {
    const url = new URL(getRedirectUrl('http://localhost:3000/projects?tab=a', '/projects?tab=a'))
    expect(url.pathname).toBe('/login')
    expect(url.searchParams.get('redirectTo')).toBe('/projects?tab=a')
  })

  it('round-trips through safeRedirectPath', () => {
    const url = new URL(getRedirectUrl('http://localhost:3000/knowledge?q=x', '/knowledge?q=x'))
    expect(safeRedirectPath(url.searchParams.get('redirectTo'))).toBe('/knowledge?q=x')
  })
})

describe('isPublicPath', () => {
  it.each(['/login', '/reset-password', '/api/auth/get-session', '/_next/static/x.js', '/noise.svg'])('treats %s as public', (path) => {
    expect(isPublicPath(path)).toBe(true)
  })

  it.each(['/', '/projects', '/settings', '/knowledge/notes/1'])('protects %s', (path) => {
    expect(isPublicPath(path)).toBe(false)
  })
})

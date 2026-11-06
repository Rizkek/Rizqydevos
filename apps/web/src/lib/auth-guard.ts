export function isPublicPath(pathname: string): boolean {
  if (!pathname || pathname === '/') {
    return false
  }

  // /api/v1 is proxied to the API, which checks the session itself and answers 401 as JSON.
  const publicPrefixes = ['/login', '/register', '/reset-password', '/api/auth', '/api/v1', '/_next', '/favicon.ico']
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return true
  }

  return pathname.includes('.')
}

// `returnPath` already carries the query string (proxy passes pathname + search).
export function getRedirectUrl(requestUrl: string, returnPath: string): string {
  const url = new URL(requestUrl)
  const nextUrl = new URL('/login', url.origin)

  nextUrl.searchParams.set('redirectTo', returnPath)
  return nextUrl.toString()
}

// Only same-site absolute paths are allowed, otherwise ?redirectTo= becomes an open redirect.
export function safeRedirectPath(value: string | null | undefined, fallback = '/'): string {
  if (!value || !value.startsWith('/')) return fallback
  // "//host" and "/\host" are treated as protocol-relative URLs by browsers.
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback
  if (value.startsWith('/login')) return fallback
  return value
}

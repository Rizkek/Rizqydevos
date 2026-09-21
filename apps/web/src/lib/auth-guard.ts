export function isPublicPath(pathname: string): boolean {
  if (!pathname || pathname === '/') {
    return false
  }

  const publicPrefixes = ['/login', '/register', '/reset-password', '/api/auth', '/_next', '/favicon.ico']
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return true
  }

  return pathname.includes('.')
}

export function getRedirectUrl(requestUrl: string, pathname: string): string {
  const url = new URL(requestUrl)
  const nextUrl = new URL('/login', url.origin)

  nextUrl.searchParams.set('redirectTo', pathname + url.search)
  return nextUrl.toString()
}

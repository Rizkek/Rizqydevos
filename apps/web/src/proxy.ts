import { betterFetch } from '@better-fetch/fetch'
import type { Session } from 'better-auth/types'
import { NextResponse, type NextRequest } from 'next/server'
import { getRedirectUrl, isPublicPath } from './lib/auth-guard'

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  try {
    const { data: session } = await betterFetch<Session>('/api/auth/get-session', {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    })

    if (!session) {
      return NextResponse.redirect(new URL(getRedirectUrl(request.url, pathname + search), request.url))
    }
  } catch {
    return NextResponse.redirect(new URL(getRedirectUrl(request.url, pathname + search), request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|register|reset-password|api/auth).*)'],
}

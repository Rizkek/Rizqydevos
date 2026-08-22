import { betterFetch } from "@better-fetch/fetch"
import type { Session } from "better-auth/types"
import { NextResponse, type NextRequest } from "next/server"

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Exclude static assets, API routes (except if we want to protect them here), and login
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/login' ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  try {
    const { data: session } = await betterFetch<Session>(
      "/api/auth/get-session",
      {
        baseURL: request.nextUrl.origin,
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      }
    )

    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  } catch (error) {
    // If auth server fails or isn't set up yet, redirect to login to be safe
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except standard Next.js exclusions
    '/((?!_next/static|_next/image|favicon.ico|login|api).*)',
  ],
}

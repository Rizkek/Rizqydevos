import type { NextConfig } from 'next'

// Origin of the NestJS API. Read at build time; on Vercel set it to the Render URL.
const API_URL = (process.env.API_URL ?? 'http://localhost:3001').replace(/\/+$/, '')

const nextConfig: NextConfig = {
  transpilePackages: ['@devos/types'],
  experimental: {
    // Enable when needed
  },
  // GitHub avatars in Developer; the profile avatar in the top bar can come from any host and stays a plain img.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'avatars.githubusercontent.com' }],
  },
  // Modules merged on 2026-10 (docs/product/overview.md); old bookmarks keep working.
  async redirects() {
    return [
      { source: '/ai', destination: '/knowledge?tab=prompts', permanent: false },
      { source: '/monitoring', destination: '/infrastructure', permanent: false },
    ]
  },
  // The browser only talks to this app. Proxying /api/v1 keeps the session cookie, which is set
  // on this domain, attached to API calls even when the API runs on another domain (Render).
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${API_URL}/api/v1/:path*` }]
  },
}

export default nextConfig

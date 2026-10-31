import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@devos/types'],
  experimental: {
    // Enable when needed
  },
  // Modules merged on 2026-10 (docs/product/overview.md); old bookmarks keep working.
  async redirects() {
    return [
      { source: '/ai', destination: '/knowledge?tab=prompts', permanent: false },
      { source: '/monitoring', destination: '/infrastructure', permanent: false },
    ]
  },
}

export default nextConfig

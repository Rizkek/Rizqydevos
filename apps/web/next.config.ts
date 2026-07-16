import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@devos/types'],
  experimental: {
    // Enable when needed
  },
}

export default nextConfig

import type { NextConfig } from 'next'

function parseMinioRemotePattern() {
  const url = process.env.MINIO_PUBLIC_URL || 'http://localhost:9000'
  try {
    const parsed = new URL(url)
    return {
      protocol: parsed.protocol.replace(':', '') as 'http' | 'https',
      hostname: parsed.hostname,
      ...(parsed.port ? { port: parsed.port } : {}),
    }
  } catch {
    return { protocol: 'http' as const, hostname: 'localhost', port: '9000' }
  }
}

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      parseMinioRemotePattern(),
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig

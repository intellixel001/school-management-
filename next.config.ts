import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

function normalizeBackendUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '')
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  /**
   * Rewrite unmatched /api/:path* requests to the Django backend so the browser
   * only ever hits the same origin. Bypasses CORS + browser privacy shields
   * (Firefox ETP, adblockers) that otherwise block cross-origin fetches.
   *
   * `fallback` is intentional: it runs AFTER Next.js has tried every local
   * filesystem route. That way our own API routes (evaluate-session,
   * practice-overview, mock-writing-evaluate, realtime/session, etc.) take
   * priority; only paths with no matching local handler get proxied.
   *
   * If NEXT_PUBLIC_API_BASE_URL is unset the rewrite is disabled — we'd
   * rather requests fail fast than silently point at an unintended origin.
   */
  async rewrites() {
    const rawBackend = process.env.NEXT_PUBLIC_API_BASE_URL
    const backend = rawBackend ? normalizeBackendUrl(rawBackend) : ''
    if (!backend) return []
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: '/api/:path*',
          destination: `${backend}/api/:path*`,
        },
      ],
    }
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // COOP + COEP are required for SharedArrayBuffer / WebRTC in production.
          // They MUST be disabled in development — they break the Next.js HMR WebSocket
          // and cause an infinite reload loop in the browser.
          ...(!isDev
            ? [
                {
                  key: 'Cross-Origin-Opener-Policy',
                  value: 'same-origin',
                },
                {
                  key: 'Cross-Origin-Embedder-Policy',
                  value: 'credentialless',
                },
              ]
            : []),
          {
            key: 'Content-Security-Policy',
            value: "img-src 'self' data: blob: https://res.cloudinary.com;",
          },
        ],
      },
    ]
  },
}

export default nextConfig

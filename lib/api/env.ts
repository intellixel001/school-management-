/**
 * @file lib/api/env.ts
 * @description Resolves the backend API base URL and the "use real API" flag.
 *
 * Values are read from public env vars (see .env.local):
 *   - NEXT_PUBLIC_API_BASE_URL   Absolute URL of the Django backend
 *   - NEXT_PUBLIC_USE_REAL_API   '1' → route services through the real backend
 *
 * ── Base URL resolution ────────────────────────────────────────────────────
 * Browser: returns "" so every apiFetch call becomes a relative path
 * (`/api/...`). Next.js `rewrites` (see next.config.ts) proxies those to the
 * backend origin. This bypasses CORS + browser privacy shields (Firefox ETP,
 * adblockers) that block direct cross-origin fetches during local dev.
 *
 * Server (SSR, Server Components, Route Handlers): returns the absolute
 * NEXT_PUBLIC_API_BASE_URL so Node's fetch can reach the backend directly.
 *
 * No hardcoded fallback URL — if the env var is missing on the server side
 * we return "" and calls fail fast, rather than silently pointing at some
 * default origin.
 */

function normalizeBackendUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '')
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export const API_BASE_URL: string = (() => {
  if (typeof window !== 'undefined') return ''
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL
  return raw ? normalizeBackendUrl(raw) : ''
})()

/**
 * Emergency client-demo switch.
 *
 * Keep this enabled while the Django/Railway service is unavailable. Every
 * service that already has a bundled dummy-data implementation will use it,
 * even when an older Vercel environment still has NEXT_PUBLIC_USE_REAL_API=1.
 * Set this back to false when the backend is ready to be reconnected.
 */
export const EMERGENCY_DEMO_MODE = false

export const USE_REAL_API: boolean =
  !EMERGENCY_DEMO_MODE && process.env.NEXT_PUBLIC_USE_REAL_API === '1'

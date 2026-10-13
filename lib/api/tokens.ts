/**
 * @file lib/api/tokens.ts
 * @description JWT access + refresh token storage for the Django backend.
 *
 * Design notes:
 *   - Stored in localStorage on the client.
 *   - Also stored in cookies on the client so that server-side components (SSR)
 *     can read them automatically via next/headers.
 *   - Access token lives 60 min; refresh token 7 days (per backend contract).
 */

const ACCESS_KEY  = 'ec-access-token'
const REFRESH_KEY = 'ec-refresh-token'

export async function getAccessToken(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(ACCESS_KEY)
  }
  // Server-side (SSR / Server Component) — dynamic import keeps next/headers
  // out of client bundles.
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const rawVal = cookieStore.get(ACCESS_KEY)?.value
    return rawVal ? decodeURIComponent(rawVal) : null
  } catch {
    return null
  }
}

export async function getRefreshToken(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(REFRESH_KEY)
  }
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const rawVal = cookieStore.get(REFRESH_KEY)?.value
    return rawVal ? decodeURIComponent(rawVal) : null
  } catch {
    return null
  }
}

export function setTokens(tokens: { access: string; refresh?: string }): void {
  if (typeof window === 'undefined') return
  
  window.localStorage.setItem(ACCESS_KEY, tokens.access)
  // Set cookie for access token (max-age 1 hour = 3600 seconds)
  document.cookie = `${ACCESS_KEY}=${encodeURIComponent(tokens.access)}; path=/; max-age=3600; SameSite=Lax`

  if (tokens.refresh) {
    window.localStorage.setItem(REFRESH_KEY, tokens.refresh)
    // Set cookie for refresh token (max-age 7 days = 604800 seconds)
    document.cookie = `${REFRESH_KEY}=${encodeURIComponent(tokens.refresh)}; path=/; max-age=604800; SameSite=Lax`
  }
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return
  
  window.localStorage.removeItem(ACCESS_KEY)
  window.localStorage.removeItem(REFRESH_KEY)
  
  // Clear cookies
  document.cookie = `${ACCESS_KEY}=; path=/; max-age=0; SameSite=Lax`
  document.cookie = `${REFRESH_KEY}=; path=/; max-age=0; SameSite=Lax`
}

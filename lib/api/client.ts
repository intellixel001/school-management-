/**
 * @file lib/api/client.ts
 * @description Central `fetch` wrapper for the Django backend.
 *
 * Responsibilities:
 *   1. Prepend the API base URL.
 *   2. Attach the JWT access token as `Authorization: Bearer <token>`.
 *   3. Serialise/deserialise JSON bodies.
 *   4. Extended timeout (90 s) so Render free-tier cold starts don't
 *      trip the browser's default abort; the ApiWakeupOverlay pings
 *      /api/health at app load to soak up the first cold hit.
 *   5. On 401: try refresh-then-retry-once. On second 401, clear tokens
 *      and throw UNAUTHORIZED so the auth guards can bounce to login.
 *   6. Map the backend error envelope { error, code } → ServiceError.
 *
 * Kept intentionally small — no axios, no fetch libraries. Every service
 * function calls `apiFetch<T>(path, init)` and receives typed JSON back.
 */

import { API_BASE_URL } from './env'
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokens'
import { ServiceError, type ServiceErrorCode } from '@/lib/services/errors'

const DEFAULT_TIMEOUT_MS = 90_000  // 90 s — accommodates Render cold starts

const REFRESH_PATH = '/api/auth/token/refresh'

// Public envelope from the backend.
interface BackendErrorEnvelope {
  error?: string
  code?: string
  detail?: string
}

// Map backend error codes → our ServiceErrorCode enum.
function mapBackendCode(code: string | undefined, status: number): ServiceErrorCode {
  switch (code) {
    case 'token_not_valid':    return 'UNAUTHORIZED'
    case 'NOT_FOUND':          return 'NOT_FOUND'
    case 'BAD_REQUEST':        return 'BAD_REQUEST'
    case 'VALIDATION_ERROR':   return 'VALIDATION_ERROR'
    case 'SERVICE_ERROR':      return 'SERVICE_ERROR'
    case 'NETWORK_ERROR':      return 'NETWORK_ERROR'
    case 'EMAIL_UNVERIFIED':   return 'EMAIL_UNVERIFIED'
    case 'ACCOUNT_PENDING':    return 'ACCOUNT_PENDING'
    case 'EMAIL_TAKEN':        return 'EMAIL_TAKEN'
    case 'TURNSTILE_FAILED':   return 'TURNSTILE_FAILED'
  }
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 403) return 'FORBIDDEN'
  if (status === 404) return 'NOT_FOUND'
  if (status === 422) return 'VALIDATION_ERROR'
  if (status === 429) return 'RATE_LIMITED'
  if (status >= 500) return 'SERVICE_ERROR'
  return 'UNKNOWN'
}

export interface ApiFetchOptions extends RequestInit {
  /** JSON-serialisable body. If provided, Content-Type is set for you. */
  json?: unknown
  /** Skip the JWT header. Used for /auth/* endpoints and the refresh call itself. */
  skipAuth?: boolean
  /** Override the default 90 s timeout. */
  timeoutMs?: number
}

/**
 * Perform one HTTP request. Does NOT retry on 401 — the retry wrapper is
 * `apiFetch` below. Split so the refresh call itself can't loop.
 */
async function rawFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const { json, skipAuth, timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } = opts

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(headers as Record<string, string> | undefined),
  }

  if (!skipAuth) {
    const token = await getAccessToken()
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let res: Response
  try {
    res = await fetch(url, {
      ...rest,
      headers: finalHeaders,
      body: json !== undefined ? JSON.stringify(json) : (rest.body ?? undefined),
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ServiceError('The server took too long to respond.', 'NETWORK_ERROR')
    }
    throw new ServiceError('Cannot reach the server. Check your connection.', 'NETWORK_ERROR')
  }
  clearTimeout(timeoutId)

  // 204 or empty → return null-as-T
  if (res.status === 204) return null as T

  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')

  // Non-JSON success is unusual for this API; return raw text as T (rare).
  if (res.ok && !isJson) {
    return (await res.text()) as unknown as T
  }

  const payload = isJson ? await res.json().catch(() => ({})) : {}

  if (res.ok) return payload as T

  const envelope = payload as BackendErrorEnvelope
  const message =
    envelope.error ??
    envelope.detail ??
    `Request failed with status ${res.status}`
  const code = mapBackendCode(envelope.code, res.status)

  throw new ServiceError(message, code)
}

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns true on success (tokens updated in storage), false on failure.
 */
async function tryRefreshAccessToken(): Promise<boolean> {
  const refresh = await getRefreshToken()
  if (!refresh) return false

  try {
    const data = await rawFetch<{ access: string }>(REFRESH_PATH, {
      method:   'POST',
      json:     { refresh },
      skipAuth: true,
      // Short timeout — refresh should be quick or fail fast.
      timeoutMs: 15_000,
    })
    if (!data?.access) return false
    setTokens({ access: data.access })
    return true
  } catch {
    return false
  }
}

/**
 * Public API. Send an authenticated JSON request and receive typed JSON.
 *
 * @example
 *   const student = await apiFetch<Student>('/api/students/stu-001')
 *   const result  = await apiFetch<{ pointsAwarded: number }>('/api/practice/results', {
 *     method: 'POST',
 *     json:   { studentId, correctCount, ... },
 *   })
 */
export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  try {
    return await rawFetch<T>(path, opts)
  } catch (err) {
    // Non-401 or skipAuth call → let the error bubble.
    if (!(err instanceof ServiceError) || err.code !== 'UNAUTHORIZED' || opts.skipAuth) {
      throw err
    }

    // On the server there's no localStorage to refresh from — surface the 401
    // and let the route's error boundary / a client-side auth guard handle it.
    // (We deliberately do NOT hardcode a redirect here; login target depends on
    //  portal — teacher/student/kiosk — and the router isn't available on server.)
    if (typeof window === 'undefined') {
      throw new ServiceError('Your session has expired. Please sign in again.', 'UNAUTHORIZED')
    }

    // Client-side: try one refresh cycle, then retry the original call once.
    const refreshed = await tryRefreshAccessToken()
    if (!refreshed) {
      clearTokens()
      throw new ServiceError('Your session has expired. Please sign in again.', 'UNAUTHORIZED')
    }

    try {
      return await rawFetch<T>(path, opts)
    } catch (retryErr) {
      if (retryErr instanceof ServiceError && retryErr.code === 'UNAUTHORIZED') {
        clearTokens()
      }
      throw retryErr
    }
  }
}

/**
 * Ping the backend's public health endpoint. Never throws — returns a bool.
 * Used by the app-mount cold-start overlay to know when Render has spun up.
 */
export async function pingHealth(timeoutMs = 90_000): Promise<boolean> {
  try {
    await rawFetch<{ status: string }>('/api/health', {
      method:   'GET',
      skipAuth: true,
      timeoutMs,
    })
    return true
  } catch {
    return false
  }
}

/**
 * @file app/api/realtime/session/route.ts
 * @description Route Handler that exchanges the server-side OPENAI_API_KEY for a
 * short-lived ephemeral client token via OpenAI's /v1/realtime/sessions endpoint.
 *
 * The returned token is browser-safe (scoped, time-limited) so the client can open
 * a WebRTC/WebSocket connection directly to the Realtime API without ever exposing
 * the main API key.
 *
 * This file is strictly isolated from the Groq pipeline — it must not import from
 * app/api/chat, app/api/transcribe, or any Groq-related lib files.
 *
 * Security notes:
 * - OPENAI_API_KEY is validated at request time (not module load) so the server
 *   returns a structured 500 rather than crashing on startup.
 * - Ephemeral tokens expire quickly (OpenAI currently sets ~60 s); clients must
 *   call this endpoint fresh per session.
 *
 * TODO (production): Add rate-limiting middleware before this handler to prevent
 * token farming. Options: Upstash Ratelimit, Vercel Edge Config, or an in-memory
 * sliding-window counter behind a Redis layer.
 */

import type { NextRequest } from 'next/server'
import { REALTIME_CONFIG } from '@/lib/realtime/config'
import type { SessionResponse, SessionError } from '@/types/realtime'

/** OpenAI Realtime sessions endpoint. */
const OPENAI_SESSIONS_URL = 'https://api.openai.com/v1/realtime/sessions'

/**
 * POST /api/realtime/session
 *
 * Creates an OpenAI Realtime ephemeral session and returns its client_secret
 * along with the token expiry timestamp.
 *
 * @returns 200 { client_secret, expires_at } on success
 * @returns 500 { error } if OPENAI_API_KEY is absent
 * @returns 4xx/5xx { error, code } if OpenAI rejects the request
 */
export async function POST(_req: NextRequest): Promise<Response> {
  // ── 1. Validate server-side API key ─────────────────────────────────────────
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const body: SessionError = {
      error: 'OPENAI_API_KEY is not configured. Add it to .env.local.',
      code: 'missing_api_key',
    }
    return Response.json(body, { status: 500 })
  }

  // ── 2. Request ephemeral session from OpenAI ─────────────────────────────────
  // 8-second hard timeout — if OpenAI takes longer than this the client would
  // have already surfaced a connection error anyway.
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8_000)

  let openaiResponse: Response
  try {
    openaiResponse = await fetch(OPENAI_SESSIONS_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: REALTIME_CONFIG.model,
        voice: REALTIME_CONFIG.voice,
        modalities: REALTIME_CONFIG.modalities,
        turn_detection: REALTIME_CONFIG.turn_detection,
      }),
    })
  } catch (networkError: unknown) {
    clearTimeout(timeoutId)
    const isTimeout =
      networkError instanceof DOMException && networkError.name === 'AbortError'
    const message = isTimeout
      ? 'Request to OpenAI timed out after 8 seconds'
      : networkError instanceof Error
        ? networkError.message
        : 'Network error reaching OpenAI API'
    const code = isTimeout ? 'timeout' : 'network_error'
    const body: SessionError = { error: message, code }
    return Response.json(body, { status: 502 })
  }
  clearTimeout(timeoutId)

  // ── 3. Handle OpenAI API error responses ─────────────────────────────────────
  if (!openaiResponse.ok) {
    let errorMessage = `OpenAI API error: ${openaiResponse.status} ${openaiResponse.statusText}`
    let errorCode = String(openaiResponse.status)

    try {
      // OpenAI returns structured JSON errors for 4xx/5xx responses.
      const errorData: unknown = await openaiResponse.json()
      if (
        errorData !== null &&
        typeof errorData === 'object' &&
        'error' in errorData &&
        errorData.error !== null &&
        typeof errorData.error === 'object' &&
        'message' in errorData.error &&
        typeof errorData.error.message === 'string'
      ) {
        errorMessage = errorData.error.message
        if (
          'code' in errorData.error &&
          typeof errorData.error.code === 'string'
        ) {
          errorCode = errorData.error.code
        }
      }
    } catch {
      // JSON parse failed — stick with the HTTP status message above.
    }

    const body: SessionError = { error: errorMessage, code: errorCode }
    return Response.json(body, { status: openaiResponse.status })
  }

  // ── 4. Parse and return the successful session payload ───────────────────────
  try {
    const data: unknown = await openaiResponse.json()

    // Validate the shape we need before returning to the client.
    if (
      data === null ||
      typeof data !== 'object' ||
      !('client_secret' in data) ||
      !('expires_at' in data)
    ) {
      const body: SessionError = {
        error:
          'Unexpected response shape from OpenAI Realtime sessions endpoint.',
        code: 'invalid_response',
      }
      return Response.json(body, { status: 502 })
    }

    const rawSecret = (data as Record<string, unknown>).client_secret
    const rawExpiry = (data as Record<string, unknown>).expires_at

    // client_secret may be an object with a `value` field (OpenAI's current format)
    // or a plain string. Handle both defensively.
    let clientSecret: string
    if (typeof rawSecret === 'string') {
      clientSecret = rawSecret
    } else if (
      rawSecret !== null &&
      typeof rawSecret === 'object' &&
      'value' in rawSecret &&
      typeof (rawSecret as Record<string, unknown>).value === 'string'
    ) {
      clientSecret = (rawSecret as Record<string, unknown>).value as string
    } else {
      const body: SessionError = {
        error: 'Could not extract client_secret from OpenAI response.',
        code: 'invalid_secret_format',
      }
      return Response.json(body, { status: 502 })
    }

    const expiresAt =
      typeof rawExpiry === 'number' ? rawExpiry : Date.now() + 60_000

    const responseBody: SessionResponse = {
      client_secret: clientSecret,
      expires_at: expiresAt,
    }
    return Response.json(responseBody, { status: 200 })
  } catch (parseError: unknown) {
    const message =
      parseError instanceof Error ? parseError.message : 'Failed to parse OpenAI response'
    const body: SessionError = { error: message, code: 'parse_error' }
    return Response.json(body, { status: 502 })
  }
}

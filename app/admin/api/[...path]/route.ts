import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_COOKIE, createSession, credentialsMatch, allowAttempt } from '@/lib/admin/security'
import { cookieOptions, isAdmin } from '@/lib/admin/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'no-store, private', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY' }
const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers })

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const endpoint = (await context.params).path.join('/')
    if (request.method === 'POST') {
      const origin = `${request.nextUrl.protocol}//${request.headers.get('host') ?? request.nextUrl.host}`
      if (request.headers.get('origin') !== origin || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Invalid request origin.' }, 403)
    }
    if (endpoint === 'login' && request.method === 'POST') {
      if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) return json({ error: 'Admin credentials are not configured.' }, 503)
      if (!allowAttempt('admin-login')) return json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' }, 429)
      if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'JSON request required.' }, 415)
      const reader = request.body?.getReader()
      if (!reader) return json({ error: 'Missing request body.' }, 400)
      let size = 0
      const chunks: Uint8Array[] = []
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > 8192) { await reader.cancel(); return json({ error: 'Request too large.' }, 413) }
        chunks.push(value)
      }
      let body
      try { body = JSON.parse(Buffer.concat(chunks).toString()) } catch { return json({ error: 'Invalid JSON.' }, 400) }
      if (!body || typeof body.username !== 'string' || typeof body.password !== 'string' || !credentialsMatch(body.username, body.password)) return json({ error: 'Incorrect username or password.' }, 401)
      const jar = await cookies()
      jar.set(ADMIN_COOKIE, createSession(), cookieOptions)
      // Clear any obsolete cookie left by the removed teacher-connection flow.
      jar.set('ec-admin-backend', '', { ...cookieOptions, maxAge: 0 })
      return json({ ok: true })
    }
    if (!await isAdmin()) return json({ error: 'Please sign in again.', code: 'UNAUTHORIZED' }, 401)
    if (endpoint === 'logout' && request.method === 'POST') {
      const jar = await cookies()
      for (const name of [ADMIN_COOKIE, 'ec-admin-backend']) jar.set(name, '', { ...cookieOptions, maxAge: 0 })
      return json({ ok: true })
    }
    if (endpoint === 'session' && request.method === 'GET') {
      (await cookies()).set('ec-admin-backend', '', { ...cookieOptions, maxAge: 0 })
      return json({ authenticated: true })
    }
    // There are deliberately no backend proxy or account mutation routes.
    return json({ error: 'Admin endpoint not implemented.' }, 404)
  } catch { return json({ error: 'Request could not be completed.' }, 500) }
}
export const GET = handle
export const POST = handle

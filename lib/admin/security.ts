import { createHash, createHmac, timingSafeEqual, randomBytes } from 'node:crypto'

export const ADMIN_COOKIE = 'ec-admin-session'
export const SESSION_SECONDS = 4 * 60 * 60

function key(purpose: string) {
  const { ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET } = process.env
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) throw new Error('Admin credentials are not configured.')
  return createHash('sha256').update(JSON.stringify([purpose, ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_SESSION_SECRET ?? ''])).digest()
}

export function credentialsMatch(username: string, password: string) {
  const hash = (s: string) => createHash('sha256').update(s).digest()
  const user = timingSafeEqual(hash(username), hash(process.env.ADMIN_USERNAME ?? ''))
  const pass = timingSafeEqual(hash(password), hash(process.env.ADMIN_PASSWORD ?? ''))
  return !!process.env.ADMIN_USERNAME && !!process.env.ADMIN_PASSWORD && user && pass
}

export function createSession(now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ exp: now + SESSION_SECONDS * 1000, nonce: randomBytes(24).toString('hex') })).toString('base64url')
  return `${payload}.${createHmac('sha256', key('session')).update(payload).digest('base64url')}`
}

export function verifySession(token?: string, now = Date.now()): boolean {
  try {
    if (!token || token.length > 1024) return false
    const parts = token.split('.')
    if (parts.length !== 2) return false
    const [payload, signature] = parts
    const expected = createHmac('sha256', key('session')).update(payload).digest()
    const supplied = Buffer.from(signature, 'base64url')
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return typeof data.exp === 'number' && data.exp > now && data.exp <= now + SESSION_SECONDS * 1000 && typeof data.nonce === 'string'
  } catch { return false }
}

// Best-effort per-instance protection. Add a platform/WAF rate rule in Vercel.
const attempts = new Map<string, { count: number; until: number }>()
export function allowAttempt(bucket: string, now = Date.now()) {
  for (const [id, value] of attempts) if (value.until <= now) attempts.delete(id)
  const record = attempts.get(bucket) ?? { count: 0, until: now + 15 * 60 * 1000 }
  if (record.count >= 8) return false
  if (attempts.size >= 5000 && !attempts.has(bucket)) return false
  record.count++; attempts.set(bucket, record); return true
}

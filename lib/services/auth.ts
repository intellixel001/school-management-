/**
 * @file lib/services/auth.ts
 * @description Real-backend implementation of the auth endpoints documented
 * in api_docs.md §Authentication.
 *
 * This module is deliberately narrow: raw HTTP calls, plus token persistence.
 * The wider `authenticateStudent` / `authenticateTeacher` service functions
 * (students.ts / teacher.ts) branch on the USE_REAL_API flag and delegate
 * here — so call-sites in the app don't change.
 *
 * Response-shape adapters live here too, because the backend returns fields
 * we need to normalise before handing back to the frontend types:
 *   - Teacher.avatar can be `null` in backend → normalise to '' for our type.
 *   - Backend flattens the tokens into the login body; we split them out into
 *     lib/api/tokens before returning the user record.
 */

import { apiFetch } from '@/lib/api/client'
import { setTokens, clearTokens } from '@/lib/api/tokens'
import { ServiceError } from './errors'
import type { Student, Teacher } from '@/types/platform'

// ── Backend response shapes ──────────────────────────────────────────────────

interface TokensPair {
  access:  string
  refresh: string
}

/**
 * Full student login payload returned by kiosk-login and student-login.
 * Superset of our frontend Student interface — plus the JWT tokens.
 */
interface StudentLoginResponse extends Student {
  badges?:          string[]
  isActive?:        boolean
  isEmailVerified?: boolean
  tokens:           TokensPair
}

interface TeacherLoginResponse {
  id:                string
  name:              string
  email:             string
  avatar:            string | null
  assignedStudents:  string[]
  tokens:            TokensPair
}

interface MeStudentResponse {
  id:              string
  role:            'student'
  name:            string
  email:           string
  isEmailVerified: boolean
  profile:         Student
}

interface MeTeacherResponse {
  id:              string
  role:            'teacher'
  name:            string
  email:           string
  isEmailVerified: boolean
  profile:         Teacher
}

export type MeResponse = MeStudentResponse | MeTeacherResponse

// ── Adapters ─────────────────────────────────────────────────────────────────

function adaptTeacher(raw: TeacherLoginResponse | Teacher): Teacher {
  return {
    id:               raw.id,
    name:             raw.name,
    email:            raw.email,
    avatar:           raw.avatar ?? '',
    assignedStudents: raw.assignedStudents ?? [],
    pendingReviews:   'pendingReviews' in raw ? (raw as Teacher).pendingReviews ?? 0 : 0,
  }
}

// ── Login flows ──────────────────────────────────────────────────────────────

/** Teacher email + password → JWT tokens + Teacher record. */
export async function loginTeacherApi(email: string, password: string): Promise<Teacher> {
  const res = await apiFetch<TeacherLoginResponse>('/api/auth/teacher-login', {
    method:   'POST',
    json:     { email, password },
    skipAuth: true,
  })
  if (!res.tokens?.access) {
    throw new ServiceError('Login response missing tokens', 'SERVICE_ERROR')
  }
  setTokens(res.tokens)
  return adaptTeacher(res)
}

/**
 * Student email + PIN. Used by the personal-device student portal login.
 *
 * NOTE: the kiosk no longer calls this — it uses `loginStudentByPinOnlyApi`
 * below. This endpoint is kept unchanged so the student dashboard keeps
 * working exactly as before.
 */
export async function loginStudentByPinApi(email: string, pin: string): Promise<Student> {
  const res = await apiFetch<StudentLoginResponse>('/api/auth/kiosk-login', {
    method:   'POST',
    json:     { email, pin },
    skipAuth: true,
  })
  if (!res.tokens?.access) {
    throw new ServiceError('Login response missing tokens', 'SERVICE_ERROR')
  }
  setTokens(res.tokens)
  return stripStudentAuxFields(res)
}

/**
 * Student PIN only — the kiosk sign-in path.
 *
 * The PIN is the sole credential AND the sole identifier here, so the backend
 * must treat it as globally unique across all students. A wrong PIN identifies
 * nobody, so the backend returns a generic 401 (never "no such student") to
 * avoid leaking which PINs exist.
 *
 * Backend contract: POST /api/auth/kiosk-pin-login  body { pin }
 */
export async function loginStudentByPinOnlyApi(pin: string): Promise<Student> {
  const res = await apiFetch<StudentLoginResponse>('/api/auth/kiosk-pin-login', {
    method:   'POST',
    json:     { pin },
    skipAuth: true,
  })
  if (!res.tokens?.access) {
    throw new ServiceError('Login response missing tokens', 'SERVICE_ERROR')
  }
  setTokens(res.tokens)
  return stripStudentAuxFields(res)
}

/** Student email + password (reserved for a future personal-device flow). */
export async function loginStudentByPasswordApi(email: string, password: string): Promise<Student> {
  const res = await apiFetch<StudentLoginResponse>('/api/auth/student-login', {
    method:   'POST',
    json:     { email, password },
    skipAuth: true,
  })
  if (!res.tokens?.access) {
    throw new ServiceError('Login response missing tokens', 'SERVICE_ERROR')
  }
  setTokens(res.tokens)
  return stripStudentAuxFields(res)
}

function stripStudentAuxFields(res: StudentLoginResponse): Student {
  // Drop tokens + backend-only extras (`badges`, `isActive`, `isEmailVerified`)
  // so consumers get a clean Student matching types/platform.ts.
  const { tokens: _tokens, badges: _b, isActive: _a, isEmailVerified: _v, ...student } = res
  void _tokens; void _b; void _a; void _v
  return student as Student
}

// ── Session hydration + logout ───────────────────────────────────────────────

/**
 * GET /api/auth/me — used to rehydrate the session on a full page reload when
 * we have a token but no session in localStorage. Returns the discriminated
 * union so callers can branch on `role`.
 */
export async function getCurrentUserApi(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/api/auth/me')
}

/**
 * Server-side logout is stateless (backend returns 200 with a friendly message)
 * but we still call it so any audit hooks fire. Always wipes local tokens even
 * if the network call fails — logout must never be blocked by a bad connection.
 */
export async function logoutApi(): Promise<void> {
  try {
    await apiFetch<{ message: string }>('/api/auth/logout', { method: 'POST' })
  } catch {
    /* Ignore — client-side wipe is what matters. */
  }
  clearTokens()
}

// ── Registration + OTP ───────────────────────────────────────────────────────

export async function requestOtpApi(email: string): Promise<void> {
  await apiFetch<{ message: string; email: string }>('/api/auth/request-otp', {
    method:   'POST',
    json:     { email },
    skipAuth: true,
  })
}

export async function verifyOtpApi(email: string, code: string): Promise<void> {
  await apiFetch<{ message: string; verified: boolean }>('/api/auth/verify-otp', {
    method:   'POST',
    json:     { email, code },
    skipAuth: true,
  })
}

/**
 * Create a new student account. The backend expects password in the
 * body; the current UI collects (email, name, pin) only, so a caller wanting
 * to use this must supply defaults for missing fields — see
 * `completeRegistration` in students.ts for how the shim does it.
 */
/**
 * Register a new student.
 *
 * The client no longer sends a PIN — the backend generates a random, globally
 * unique 6-digit PIN and emails it to the student on approval. `turnstileToken`
 * is the Cloudflare Turnstile result, which the backend must verify server-side
 * before creating the account.
 */
export async function registerStudentApi(payload: {
  name:  string
  email: string
  turnstileToken?: string
}): Promise<Student> {
  const res = await apiFetch<Student & { badges?: string[]; isActive?: boolean; isEmailVerified?: boolean }>(
    '/api/auth/register',
    { method: 'POST', json: payload, skipAuth: true },
  )
  const { badges: _b, isActive: _a, isEmailVerified: _v, ...student } = res
  void _b; void _a; void _v
  return student as Student
}

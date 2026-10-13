// ── Teacher Service ────────────────────────────────────────────────────────────
// Also absorbs the fabricated review queue items previously in
// app/teacher/_components/reviewQueueItems.ts — that file is no longer needed.

import { DUMMY_TEACHER } from '@/lib/dummy/teacher'
import { ServiceError }  from './errors'
import { USE_REAL_API }  from '@/lib/api/env'
import { apiFetch }      from '@/lib/api/client'
import { loginTeacherApi } from './auth'
import { MOCK_TEACHER_FOR_DEMO } from './demoFlags'
import { coalesce } from './requestCache'
import type { Teacher } from '@/types/platform'


// ── Service functions ─────────────────────────────────────────────────────────

export async function getTeacher(): Promise<Teacher> {
  if (USE_REAL_API && !MOCK_TEACHER_FOR_DEMO) {
    // Coalesced — the dashboard and the auth guard both read this on one load.
    const raw = await coalesce(
      'teacher:me',
      () => apiFetch<Teacher & { avatar: string | null }>('/api/teacher'),
    )
    return { ...raw, avatar: raw.avatar ?? '', pendingReviews: raw.pendingReviews ?? 0 }
  }
  try {
    return Promise.resolve(DUMMY_TEACHER)
  } catch {
    throw new ServiceError('Failed to fetch teacher data', 'NETWORK_ERROR')
  }
}


/**
 * Authenticate the teacher using email + password.
 *
 * TODO Phase 11 (Django/Supabase backend):
 *   POST /api/auth/teacher-login
 *   Body: { email: string, password: string }
 *   Returns 200 + Teacher JSON on success
 *   Returns 401 if credentials are wrong
 *
 * @throws ServiceError with code 'NOT_FOUND' for invalid credentials
 */
export async function authenticateTeacher(
  email: string,
  password: string,
): Promise<Teacher> {
  if (USE_REAL_API) {
    return loginTeacherApi(email, password)
  }
  // Dummy implementation: validate against single teacher record
  if (
    email.toLowerCase() === DUMMY_TEACHER.email.toLowerCase() &&
    password === (DUMMY_TEACHER as { password?: string }).password
  ) {
    return DUMMY_TEACHER
  }
  throw new ServiceError('Invalid email or password', 'NOT_FOUND')
}

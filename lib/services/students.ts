// ── Student Service ────────────────────────────────────────────────────────────
// Real-backend implementation when USE_REAL_API=1; falls back to dummy data.
// All function signatures are STABLE — call sites never need to change.

import { DUMMY_STUDENTS } from '@/lib/dummy/students'
import { DUMMY_SESSIONS } from '@/lib/dummy/sessions'
import { ServiceError }   from './errors'
import { USE_REAL_API }   from '@/lib/api/env'
import { apiFetch }       from '@/lib/api/client'
import {
  loginStudentByPinApi,
  loginStudentByPinOnlyApi,
  requestOtpApi,
  verifyOtpApi,
  registerStudentApi,
} from './auth'
import { MOCK_TEACHER_FOR_DEMO } from './demoFlags'
import { coalesce, invalidateCache } from './requestCache'
import type { Student, SkillLevel } from '@/types/platform'

/** Drop the cached student list. Call after anything that mutates a student. */
export function invalidateStudentsCache(): void {
  invalidateCache('students')
}

// ── Read — student list + single ─────────────────────────────────────────────

// Coalesced: the dashboard, getPendingStudents() and the nav badge all read
// this same list on one page load. See lib/services/requestCache.ts.
export async function getStudents(): Promise<Student[]> {
  if (USE_REAL_API && !MOCK_TEACHER_FOR_DEMO) {
    return coalesce('students:all', () => apiFetch<Student[]>('/api/students'))
  }
  return Promise.resolve(DUMMY_STUDENTS)
}

export async function getStudentById(id: string): Promise<Student | null> {
  if (USE_REAL_API) {
    try {
      return await apiFetch<Student>(`/api/students/${id}`)
    } catch (err) {
      if (err instanceof ServiceError && err.code === 'NOT_FOUND') return null
      throw err
    }
  }
  return Promise.resolve(DUMMY_STUDENTS.find(s => s.id === id) ?? null)
}

export async function getStudentByPin(pin: string): Promise<Student | null> {
  // PIN lookup is only meaningful locally — the real login is via authenticateStudent.
  const student = DUMMY_STUDENTS.find(s => s.pin === pin) ?? null
  if (!student) throw new ServiceError('No student found for PIN', 'NOT_FOUND')
  return Promise.resolve(student)
}

/**
 * Look up a student by email (no PIN check).
 * Used by Step 1 of the kiosk login modal to validate the email exists before
 * showing the PIN screen.
 *
 * Real-API note: the backend does NOT expose a public "lookup by email" endpoint
 * (the student list is teacher-only), so on real API we return a placeholder
 * "existence-unknown" record. The email is verified for real when the student
 * enters their PIN — `authenticateStudent` returns EMAIL_UNVERIFIED /
 * NOT_FOUND / ACCOUNT_PENDING codes that the UI already handles.
 * This preserves the two-step modal UX (no PIN screen for garbage emails) without
 * needing an unauthenticated existence-check endpoint.
 */
export async function getStudentByEmail(email: string): Promise<Student | null> {
  if (USE_REAL_API) {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) return null
    // Placeholder record — only `email` is meaningful; the modal only reads
    // this to know "yes, proceed to PIN step".
    return {
      id:                '',
      name:              '',
      email:             cleanEmail,
      pin:               '',
      level:             'entry-1',
      enrolledDate:      '',
      lastActive:        '',
      skills:            { reading: 0, writing: 0, speaking: 0, listening: 0 },
      completedSessions: 0,
      streak:            0,
      status:            'active',
      ilpTargets:        [],
      totalPoints:       0,
    } as Student
  }
  return Promise.resolve(
    DUMMY_STUDENTS.find(s => s.email.toLowerCase() === email.toLowerCase()) ?? null
  )
}

// ── Authentication ────────────────────────────────────────────────────────────

/**
 * Authenticate a student using email + PIN.
 * In real-API mode delegates to the kiosk-login endpoint which also handles
 * ACCOUNT_PENDING and EMAIL_UNVERIFIED via error codes the client already maps.
 */
export async function authenticateStudent(email: string, pin: string): Promise<Student> {
  const cleanEmail = email.trim().toLowerCase()

  if (USE_REAL_API) {
    return loginStudentByPinApi(cleanEmail, pin)
  }

  const student = DUMMY_STUDENTS.find(
    s => s.email.toLowerCase() === cleanEmail && s.pin === pin
  )
  if (!student) throw new ServiceError('Invalid email or PIN', 'NOT_FOUND')
  if (student.status === 'pending') {
    throw new ServiceError(
      'Your account is awaiting teacher approval. Please contact your teacher.',
      'ACCOUNT_PENDING'
    )
  }
  return student
}

/**
 * Authenticate a student using ONLY their 6-digit PIN — the kiosk sign-in path.
 *
 * The PIN is both identifier and credential here, which is why the backend must
 * enforce global uniqueness across all students. Errors are intentionally
 * generic ("Incorrect PIN") so a failed attempt never reveals whether a given
 * PIN belongs to a real account.
 */
export async function authenticateStudentByPin(pin: string): Promise<Student> {
  const trimmedPin = pin.trim()

  if (!/^\d{6}$/.test(trimmedPin)) {
    throw new ServiceError('PIN must be exactly 6 digits', 'INVALID_PIN')
  }

  if (USE_REAL_API) {
    return loginStudentByPinOnlyApi(trimmedPin)
  }

  const student = DUMMY_STUDENTS.find(s => s.pin === trimmedPin)
  if (!student) throw new ServiceError('Incorrect PIN', 'NOT_FOUND')
  if (student.status === 'pending') {
    throw new ServiceError(
      'Your account is awaiting teacher approval. Please contact your teacher.',
      'ACCOUNT_PENDING'
    )
  }
  return student
}

// ── Points (internal helper — not called directly from UI) ────────────────────
//
// In real-API mode points are awarded server-side inside recordPracticeResult /
// recordQuizResult. Mock exams award NO points (assessment only).
// This helper is kept for the dummy-data path only.
//
// Point ranges by source:
//   practice → 0–25 (5 per correct answer, max 5 questions)
//   quiz     → 0–5  (1 per correct answer, max 5 questions)
//   mock     → always 0 (assessments don't grant points)

export async function addPointsToStudent(
  studentId: string,
  points: number,
  source: 'practice' | 'quiz' | 'mock',
  sessionId?: string
): Promise<Student> {
  if (points < 0 || points > 25) {
    throw new ServiceError(`Points out of range: ${points}`, 'INVALID_INPUT')
  }
  // Mock exams never award points — enforce here so a stray call can't sneak past.
  if (source === 'mock' && points !== 0) {
    throw new ServiceError('Mock exams cannot award points', 'INVALID_INPUT')
  }
  if (USE_REAL_API) {
    const student = await getStudentById(studentId)
    if (!student) throw new ServiceError(`Student ${studentId} not found`, 'NOT_FOUND')
    return student
  }
  const student = DUMMY_STUDENTS.find(s => s.id === studentId)
  if (!student) throw new ServiceError(`Student ${studentId} not found`, 'NOT_FOUND')
  void source
  void sessionId
  student.totalPoints = (student.totalPoints ?? 0) + points
  return student
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface StudentStats {
  completedSessions: number
  totalHoursPracticed: number
  recentSessionsCount: number
}

export async function getStudentStats(studentId: string): Promise<StudentStats> {
  if (USE_REAL_API) {
    // Derived from the student profile fields returned by the backend.
    const student = await getStudentById(studentId)
    if (!student) throw new ServiceError(`Student ${studentId} not found`, 'NOT_FOUND')
    return {
      completedSessions:   student.completedSessions ?? 0,
      totalHoursPracticed: 0,   // not exposed by the API directly
      recentSessionsCount: 0,   // not exposed by the API directly
    }
  }
  const sessions = DUMMY_SESSIONS.filter(
    s => s.studentId === studentId && s.status === 'completed'
  )
  const completedSessions  = sessions.length
  const totalSeconds       = sessions.reduce((acc, s) => acc + s.duration, 0)
  const totalHoursPracticed = Math.round((totalSeconds / 3600) * 10) / 10
  const sevenDaysAgo       = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentSessionsCount = sessions.filter(
    s => new Date(s.date).getTime() > sevenDaysAgo
  ).length
  return Promise.resolve({ completedSessions, totalHoursPracticed, recentSessionsCount })
}

// ── Pending students ──────────────────────────────────────────────────────────

export async function getPendingStudents(): Promise<Student[]> {
  if (USE_REAL_API && !MOCK_TEACHER_FOR_DEMO) {
    const all = await getStudents()
    return all
      .filter(s => s.status === 'pending')
      .sort((a, b) => {
        const aDate = a.enrolledDate ? new Date(a.enrolledDate).getTime() : 0
        const bDate = b.enrolledDate ? new Date(b.enrolledDate).getTime() : 0
        if (aDate !== bDate) return bDate - aDate
        return a.name.localeCompare(b.name)
      })
  }
  const pending = DUMMY_STUDENTS.filter(s => s.status === 'pending')
  pending.sort((a, b) => {
    const aDate = a.enrolledDate ? new Date(a.enrolledDate).getTime() : 0
    const bDate = b.enrolledDate ? new Date(b.enrolledDate).getTime() : 0
    if (aDate !== bDate) return bDate - aDate
    return a.name.localeCompare(b.name)
  })
  return Promise.resolve(pending)
}

/**
 * Approve a pending student and set their initial level.
 *
 * Backend contract (see the approvals page in app/teacher/approvals):
 *   POST /api/students/{id}/approve
 *   Body: { level: SkillLevel }
 *   Returns 200 + the updated Student with status flipped to 'active'.
 *   Returns 404 if not found; 400 if the student is not pending.
 * Falls back to the in-memory dummy mutation when the real API is off.
 */
export async function approveStudent(studentId: string, level: SkillLevel): Promise<Student> {
  if (USE_REAL_API && !MOCK_TEACHER_FOR_DEMO) {
    const updated = await apiFetch<Student>(`/api/students/${studentId}/approve`, {
      method: 'POST',
      json:   { level },
    })
    invalidateStudentsCache()   // the list just changed — don't serve it stale
    return updated
  }
  const student = DUMMY_STUDENTS.find(s => s.id === studentId)
  if (!student) throw new ServiceError(`Student ${studentId} not found`, 'NOT_FOUND')
  if (student.status !== 'pending') {
    throw new ServiceError(
      `Student ${studentId} is not pending approval (current status: ${student.status})`,
      'INVALID_INPUT'
    )
  }
  student.status = 'active'
  student.level  = level
  if (!student.enrolledDate) student.enrolledDate = new Date().toISOString()
  return Promise.resolve(student)
}

/**
 * Reject a pending registration. This is DESTRUCTIVE and irreversible — the
 * account and its PIN are deleted outright rather than flagged, so the emailed
 * PIN stops working and the address is free to register again.
 *
 * Backend contract (see the approvals page in app/teacher/approvals):
 *   POST /api/students/{id}/reject
 *   Returns 200/204 once the record and its PIN are deleted.
 *   Returns 404 if not found; 400 if the student is NOT pending.
 * Falls back to the in-memory dummy mutation when the real API is off.
 */
export async function rejectStudent(studentId: string): Promise<void> {
  if (USE_REAL_API && !MOCK_TEACHER_FOR_DEMO) {
    await apiFetch<void>(`/api/students/${studentId}/reject`, { method: 'POST' })
    invalidateStudentsCache()   // the account is gone — don't serve it stale
    return
  }
  const idx = DUMMY_STUDENTS.findIndex(s => s.id === studentId)
  if (idx === -1) throw new ServiceError(`Student ${studentId} not found`, 'NOT_FOUND')
  if (DUMMY_STUDENTS[idx].status !== 'pending') {
    throw new ServiceError(
      `Student ${studentId} is not pending approval (current status: ${DUMMY_STUDENTS[idx].status})`,
      'INVALID_INPUT'
    )
  }
  DUMMY_STUDENTS.splice(idx, 1)
}

/**
 * Teacher-only: change an already-approved student's level.
 * TODO Phase 11 (Django/Supabase backend):
 *   PATCH /api/students/{id}/level
 *   Body: { level: SkillLevel }
 *   Auth: teacher session required
 *   Returns 200 + updated Student on success
 *   Returns 404 if student not found; 400 if student.status === 'pending'
 *     (pending students must be approved via approveStudent, which sets level).
 */
export async function updateStudentLevel(studentId: string, level: SkillLevel): Promise<Student> {
  if (USE_REAL_API) {
    const updated = await apiFetch<Student>(`/api/students/${studentId}/level`, {
      method: 'PATCH',
      json:   { level },
    })
    invalidateStudentsCache()   // level changed — don't serve it stale
    return updated
  }
  const student = DUMMY_STUDENTS.find(s => s.id === studentId)
  if (!student) throw new ServiceError(`Student ${studentId} not found`, 'NOT_FOUND')
  if (student.status === 'pending') {
    throw new ServiceError(
      `Student ${studentId} is pending approval — use approveStudent instead`,
      'INVALID_INPUT'
    )
  }
  student.level = level
  return Promise.resolve(student)
}

// ── Registration ──────────────────────────────────────────────────────────────

// ⚠️  TEMPORARY — DEMO / SCREENSHOT MODE
// When true, the three register endpoints (request-otp, verify-otp, complete)
// skip the real backend and simulate success locally. New accounts will NOT
// appear in the teacher dashboard (they only live in in-memory dummy data
// for this session). To restore real backend: set to `false`.
const MOCK_REGISTER_FOR_DEMO = false

export async function requestRegistrationOTP(email: string): Promise<void> {
  const trimmed = email.trim().toLowerCase()
  if (USE_REAL_API && !MOCK_REGISTER_FOR_DEMO) return requestOtpApi(trimmed)
  return Promise.resolve()
}

export async function verifyRegistrationOTP(email: string, code: string): Promise<void> {
  const trimmedCode = code.trim()
  if (!/^\d{6}$/.test(trimmedCode)) {
    throw new ServiceError('Code must be 6 digits', 'INVALID_PIN')
  }
  if (USE_REAL_API && !MOCK_REGISTER_FOR_DEMO) return verifyOtpApi(email.trim().toLowerCase(), trimmedCode)
  return Promise.resolve()
}

/**
 * Create the student account.
 *
 * The student no longer chooses a PIN. The backend generates a random, globally
 * unique 6-digit PIN and emails it to them — see the backend handoff notes.
 * `turnstileToken` comes from the Cloudflare Turnstile widget on the register
 * form and must be verified server-side before the account is created.
 */
export async function completeRegistration(
  email: string,
  name: string,
  turnstileToken?: string
): Promise<Student> {
  const trimmedEmail = email.trim().toLowerCase()
  const trimmedName  = name.trim()

  if (USE_REAL_API && !MOCK_REGISTER_FOR_DEMO) {
    return registerStudentApi({
      name:  trimmedName,
      email: trimmedEmail,
      turnstileToken,
    })
  }

  if (DUMMY_STUDENTS.find(s => s.email.toLowerCase() === trimmedEmail)) {
    throw new ServiceError('This email is already registered', 'EMAIL_TAKEN')
  }

  const newId = `stu-${Date.now().toString().slice(-6)}`
  // Mirror the real backend: generate a random, non-sequential 6-digit PIN and
  // guarantee it is unique across all students (PIN is the sole kiosk identifier).
  const generateUniquePin = (): string => {
    for (let attempt = 0; attempt < 50; attempt++) {
      const candidate = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0')
      if (!DUMMY_STUDENTS.some(s => s.pin === candidate)) return candidate
    }
    throw new ServiceError('Could not allocate a unique PIN', 'SERVICE_ERROR')
  }

  const newStudent: Student = {
    id:                newId,
    name:              trimmedName,
    email:             trimmedEmail,
    pin:               generateUniquePin(),
    level:             'entry-1',
    enrolledDate:      '',
    lastActive:        '',
    skills:            { reading: 0, writing: 0, speaking: 0, listening: 0 },
    completedSessions: 0,
    streak:            0,
    status:            'pending',
    ilpTargets:        [],
    totalPoints:       0,
  }
  DUMMY_STUDENTS.push(newStudent)
  return Promise.resolve(newStudent)
}

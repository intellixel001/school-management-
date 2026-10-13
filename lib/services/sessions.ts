// ── Sessions Service ───────────────────────────────────────────────────────────
// Real-backend implementation when USE_REAL_API=1; falls back to dummy data.

import { DUMMY_SESSIONS } from '@/lib/dummy/sessions'
import { DUMMY_STUDENTS } from '@/lib/dummy/students'
import { ServiceError }   from './errors'
import { USE_REAL_API }   from '@/lib/api/env'
import { apiFetch }       from '@/lib/api/client'
import { addPointsToStudent } from './students'
import { INPUT_LIMITS } from '@/lib/security/inputLimits'
import { MOCK_TEACHER_FOR_DEMO } from './demoFlags'
import { coalesce, invalidateCache } from './requestCache'
import type { Session, Student, SkillArea, SkillLevel } from '@/types/platform'

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getSessionsByStudentId(studentId: string): Promise<Session[]> {
  if (USE_REAL_API) {
    return apiFetch<Session[]>(`/api/sessions?studentId=${encodeURIComponent(studentId)}`)
  }
  return Promise.resolve(DUMMY_SESSIONS.filter(s => s.studentId === studentId))
}

// Coalesced — the dashboard and other teacher surfaces read this on one load.
export async function getAllSessions(): Promise<Session[]> {
  if (USE_REAL_API && !MOCK_TEACHER_FOR_DEMO) {
    return coalesce('sessions:all', () => apiFetch<Session[]>('/api/sessions'))
  }
  return Promise.resolve(DUMMY_SESSIONS)
}

export async function getRecentSessions(limit: number): Promise<Session[]> {
  if (USE_REAL_API && !MOCK_TEACHER_FOR_DEMO) {
    return apiFetch<Session[]>(`/api/sessions?limit=${limit}`)
  }
  return Promise.resolve(
    [...DUMMY_SESSIONS]
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  )
}

// ── Practice Feedback ─────────────────────────────────────────────────────────

// Coalesced — read by both the dashboard and the nav badge on one page load.
export async function getPendingPracticeFeedback(): Promise<Session[]> {
  if (USE_REAL_API && !MOCK_TEACHER_FOR_DEMO) {
    // Defensive filter — quiz is a self-contained points feature, not a
    // teacher-reviewable session, even if the backend endpoint doesn't
    // already exclude it.
    const sessions = await coalesce(
      'sessions:pending-feedback',
      () => apiFetch<Session[]>('/api/sessions/pending-feedback'),
    )
    return sessions.filter(s => s.source !== 'quiz')
  }
  return Promise.resolve(
    DUMMY_SESSIONS
      .filter(s =>
        s.status === 'completed' &&
        s.source === 'practice' &&
        (s.teacherFeedback == null || s.teacherFeedback.length === 0)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  )
}

export async function getSessionById(id: string): Promise<Session | null> {
  if (USE_REAL_API) {
    // The backend hasn't shipped a dedicated GET /api/sessions/:id yet, so we
    // fall back to filtering. Callers holding a studentId in context can pass
    // it as a second arg for a much cheaper lookup — see getSessionByIdFor().
    try {
      const all = await apiFetch<Session[]>('/api/sessions')
      return all.find(s => s.id === id) ?? null
    } catch {
      return null
    }
  }
  return Promise.resolve(DUMMY_SESSIONS.find(s => s.id === id) ?? null)
}

/**
 * Efficient variant when the caller already knows which student's history to
 * search (teacher review pages always do). Scopes the fetch to that student.
 */
export async function getSessionByIdFor(
  studentId: string,
  sessionId: string,
): Promise<Session | null> {
  if (USE_REAL_API) {
    try {
      const all = await apiFetch<Session[]>(
        `/api/sessions?studentId=${encodeURIComponent(studentId)}`
      )
      return all.find(s => s.id === sessionId) ?? null
    } catch {
      return null
    }
  }
  return Promise.resolve(
    DUMMY_SESSIONS.find(s => s.id === sessionId && s.studentId === studentId) ?? null
  )
}

export async function submitPracticeFeedback(sessionId: string, feedback: string): Promise<Session> {
  const trimmed = feedback.trim()
  if (trimmed.length < 5) throw new ServiceError('Feedback must be at least 5 characters', 'INVALID_INPUT')
  if (trimmed.length > INPUT_LIMITS.TEACHER_FEEDBACK) {
    throw new ServiceError(`Feedback exceeds ${INPUT_LIMITS.TEACHER_FEEDBACK} chars`, 'INVALID_INPUT')
  }
  if (USE_REAL_API) {
    const updated = await apiFetch<Session>(`/api/sessions/${encodeURIComponent(sessionId)}/feedback`, {
      method: 'POST',
      json:   { feedback: trimmed },
    })
    // This session just left the pending-feedback queue — drop the cached reads
    // so the queue and its nav badge don't show it again.
    invalidateCache('sessions')
    return updated
  }
  const session = DUMMY_SESSIONS.find(s => s.id === sessionId)
  if (!session) throw new ServiceError('Session not found', 'NOT_FOUND')
  session.teacherFeedback = trimmed
  return Promise.resolve(session)
}

// ── Practice Result Recording ─────────────────────────────────────────────────

export interface PracticeResultInput {
  studentId:    string
  skillArea:    SkillArea
  level:        SkillLevel
  correctCount: number
  totalCount:   number
  sessionId:    string
  durationSec:  number
  status?:      'completed' | 'abandoned'
}

export interface PracticeResultOutput {
  pointsAwarded: number
  student:        Student
}

export async function recordPracticeResult(input: PracticeResultInput): Promise<PracticeResultOutput> {
  if (USE_REAL_API) {
    return apiFetch<PracticeResultOutput>('/api/practice/results', {
      method: 'POST',
      json:   {
        studentId:    input.studentId,
        skillArea:    input.skillArea,
        level:        input.level,
        correctCount: input.correctCount,
        totalCount:   input.totalCount,
        sessionId:    input.sessionId,
        durationSec:  input.durationSec,
        status:       input.status ?? 'completed',
      },
    })
  }

  const isAbandoned = input.status === 'abandoned'
  // Practice awards 5 points per correct answer, capped at 25/session (5 questions × 5).
  // Quiz stays at 1 point per correct — see recordQuizResult below.
  // Mock awards NO points (assessment, not gamification) — see publishMockSectionAttempt.
  const points = isAbandoned ? 0 : Math.max(0, Math.min(25, input.correctCount * 5))

  const student = isAbandoned
    ? (DUMMY_STUDENTS.find(s => s.id === input.studentId) ?? DUMMY_STUDENTS[0])
    : await addPointsToStudent(input.studentId, points, 'practice', input.sessionId)

  const existing = DUMMY_SESSIONS.find(s => s.id === input.sessionId)
  let newSession: Session

  if (!existing) {
    newSession = {
      id:                 input.sessionId,
      studentId:          input.studentId,
      date:               new Date().toISOString(),
      duration:           input.durationSec,
      skillArea:          input.skillArea,
      score:              isAbandoned
                            ? 0
                            : Math.round((input.correctCount / Math.max(1, input.totalCount)) * 100),
      questionsAttempted: input.totalCount,
      questionsCorrect:   isAbandoned ? 0 : input.correctCount,
      teacherFeedback:    null,
      status:             isAbandoned ? 'abandoned' : 'completed',
      source:             'practice',
      aiOverview:         null,
      aiOverviewGeneratedAt: null,
    }
    DUMMY_SESSIONS.push(newSession)
  } else {
    newSession = existing
  }

  if (!isAbandoned) {
    try {
      const overview = await _generateOverviewForSession(newSession)
      if (overview) {
        newSession.aiOverview            = overview.text
        newSession.aiOverviewGeneratedAt = overview.generatedAt
      }
    } catch {
      // Leave aiOverview = null
    }
  }

  return { pointsAwarded: points, student }
}

export interface QuizResultInput {
  studentId:    string
  correctCount: number
  totalCount:   number
  sessionId:    string
  durationSec:  number
}

export type QuizResultOutput = PracticeResultOutput

export async function recordQuizResult(input: QuizResultInput): Promise<QuizResultOutput> {
  if (USE_REAL_API) {
    return apiFetch<QuizResultOutput>('/api/quiz/results', {
      method: 'POST',
      json:   {
        studentId:    input.studentId,
        correctCount: input.correctCount,
        totalCount:   input.totalCount,
        sessionId:    input.sessionId,
        durationSec:  input.durationSec,
      },
    })
  }
  const points  = Math.max(0, Math.min(5, input.correctCount))
  const student = await addPointsToStudent(input.studentId, points, 'quiz', input.sessionId)
  return { pointsAwarded: points, student }
}

// ── AI Overview ───────────────────────────────────────────────────────────────

async function _generateOverviewForSession(
  session: Session
): Promise<{ text: string; generatedAt: string } | null> {
  const priorSessions = DUMMY_SESSIONS.filter(
    s => s.studentId === session.studentId &&
         s.skillArea  === session.skillArea &&
         s.status     === 'completed' &&
         s.id         !== session.id
  )
  const studentSkillAverage = priorSessions.length > 0
    ? Math.round(priorSessions.reduce((sum, s) => sum + s.score, 0) / priorSessions.length)
    : null

  const student = DUMMY_STUDENTS.find(s => s.id === session.studentId)

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/practice-overview`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        skill:               session.skillArea,
        level:               student?.level ?? 'unknown',
        score:               session.score,
        questionsCorrect:    session.questionsCorrect,
        questionsAttempted:  session.questionsAttempted,
        durationMinutes:     Math.round((session.duration ?? 0) / 60),
        studentSkillAverage,
      }),
    })
    if (!res.ok) return null
    const data = await res.json() as { overview: string; generatedAt: string }
    if (!data.overview) return null
    return { text: data.overview, generatedAt: data.generatedAt }
  } catch {
    return null
  }
}

export async function generatePracticeSessionOverview(sessionId: string): Promise<Session> {
  if (USE_REAL_API) {
    return apiFetch<Session>(`/api/sessions/${encodeURIComponent(sessionId)}/regenerate-overview`, {
      method: 'POST',
    })
  }
  const session = DUMMY_SESSIONS.find(s => s.id === sessionId)
  if (!session) throw new ServiceError('Session not found', 'NOT_FOUND')

  const result = await _generateOverviewForSession(session)
  if (result) {
    session.aiOverview            = result.text
    session.aiOverviewGeneratedAt = result.generatedAt
  } else {
    throw new ServiceError('AI overview generation failed. Check GROQ_API_KEY or try again.', 'NETWORK_ERROR')
  }
  return session
}

// ── Practice Service ───────────────────────────────────────────────────────────
// Handles practice session creation, skill score recomputation, streak & stats.
// All mutations are in-memory (dummy data). Replace bodies with fetch() calls
// when the Django backend ships — keep signatures identical.
//
// TODO Phase 11 (Django backend):
//   POST /api/practice/sessions   → createPracticeSession
//   POST /api/students/:id/refresh-skill-score?skill={skill}  → updateStudentSkillScore
//   (streak + completedSessions + lastActive handled in one server-side transaction)

import { DUMMY_STUDENTS } from '@/lib/dummy/students'
import { DUMMY_SESSIONS } from '@/lib/dummy/sessions'
import { ServiceError } from './errors'
import type { SkillArea, Student, SkillLevel } from '@/types/platform'
import { addPointsToStudent } from './students'
import { USE_REAL_API } from '@/lib/api/env'
import { recordPracticeResult, type PracticeResultOutput } from './sessions'

// ── Internal helper: YYYY-MM-DD string from a Date ───────────────────────────

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Internal helper: streak update (non-async, pure mutation) ────────────────
//
// Rules (locked formula from Arch-Phase-3 spec):
//   – lastActive is null/undefined → first ever session → streak = 1
//   – lastActive is TODAY          → already practised today → no change
//   – lastActive was YESTERDAY     → consecutive day → streak += 1
//   – lastActive was 2+ days ago   → gap → streak = 1 (reset)
//
// Uses YMD string comparison, NOT millisecond diff, to be timezone-safe.

function updateStreakInternal(student: Student, now: Date): void {
  const lastActiveStr = student.lastActive
  if (!lastActiveStr) {
    // First-ever session
    student.streak = 1
    return
  }

  const lastActive = new Date(lastActiveStr)
  const todayYMD     = ymd(now)
  const lastYMD      = ymd(lastActive)
  const yesterdayYMD = ymd(new Date(now.getTime() - 24 * 60 * 60 * 1000))

  if (lastYMD === todayYMD) {
    // Already practised today — streak unchanged
    return
  }
  if (lastYMD === yesterdayYMD) {
    // Consecutive day — extend streak
    student.streak = (student.streak ?? 0) + 1
    return
  }
  // 2+ day gap — reset to 1
  student.streak = 1
}

// ── updateStudentSkillScore ───────────────────────────────────────────────────
//
// Recomputes the student's skill score as the MAX of their last 3 completed
// sessions for that skill (best-of-last-3 formula, locked in Arch-Phase-3).
//
// Signature change: no longer takes `newScore`. Reads score from DUMMY_SESSIONS
// after the new session has been pushed (so order matters in createPracticeSession).
//
// Edge cases:
//   – 0 sessions in this skill → early return (leave existing score untouched)
//   – 1 or 2 sessions → max of whatever's there

export async function updateStudentSkillScore(studentId: string, skill: SkillArea): Promise<void> {
  if (USE_REAL_API) {
    // The backend automatically recalculates skill scores whenever a practice session
    // is recorded or a mock attempt is published. So this is a no-op on the real API.
    return Promise.resolve()
  }

  const student = DUMMY_STUDENTS.find(s => s.id === studentId)
  if (!student) throw new ServiceError(`Student ${studentId} not found`, 'NOT_FOUND')

  // Find the last 3 completed sessions for this student + skill, newest first
  const recentSessions = DUMMY_SESSIONS
    .filter(s => s.studentId === studentId && s.skillArea === skill && s.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  if (recentSessions.length === 0) {
    // No sessions yet — leave the existing skill field untouched
    return Promise.resolve()
  }

  // bestScore is ALWAYS the max — safe since recentSessions.length >= 1
  const bestScore = Math.max(...recentSessions.map(s => s.score))

  if (!student.skills) {
    student.skills = { reading: 0, writing: 0, speaking: 0, listening: 0 }
  }
  student.skills[skill] = bestScore

  return Promise.resolve()
}

// ── createPracticeSession ─────────────────────────────────────────────────────
//
// 6-step sequence (ORDER MATTERS):
//   1. Push session record into DUMMY_SESSIONS  ← must be FIRST so updateStudentSkillScore can see it
//   2. Recompute skill score (best-of-last-3)
//   3. Increment completedSessions
//   4. Update streak (consecutive-day logic)
//   5. Update lastActive
//   6. Award points
//
// All 6 mutations happen in one call. Django will do this in one transaction.

export async function createPracticeSession(data: {
  studentId: string
  skill: SkillArea
  level: string
  correctCount: number
  totalQuestions: number
  durationSec: number
}): Promise<PracticeResultOutput> {
  if (USE_REAL_API) {
    const sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36)

    return recordPracticeResult({
      studentId: data.studentId,
      skillArea: data.skill,
      level: data.level as SkillLevel,
      correctCount: data.correctCount,
      totalCount: data.totalQuestions,
      sessionId: sessionId,
      durationSec: data.durationSec,
      status: 'completed',
    })
  }

  const student = DUMMY_STUDENTS.find(s => s.id === data.studentId)
  if (!student) throw new ServiceError(`Student ${data.studentId} not found`, 'NOT_FOUND')

  const scorePercent = Math.round((data.correctCount / data.totalQuestions) * 100)
  const now    = new Date()
  const nowIso = now.toISOString()
  const sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2) + Date.now().toString(36)

  // ── Step 1: Push session record FIRST ─────────────────────────────────────
  DUMMY_SESSIONS.push({
    id:                sessionId,
    studentId:         data.studentId,
    date:              nowIso,
    duration:          data.durationSec,
    skillArea:         data.skill,
    score:             scorePercent,
    questionsAttempted: data.totalQuestions,
    questionsCorrect:  data.correctCount,
    teacherFeedback:   null,
    status:            'completed',
    source:            'practice',
  })

  // ── Step 2: Recompute skill score from sessions (best-of-last-3) ──────────
  await updateStudentSkillScore(data.studentId, data.skill)

  // ── Step 3: Increment completedSessions ───────────────────────────────────
  student.completedSessions = (student.completedSessions ?? 0) + 1

  // ── Step 4: Update streak ─────────────────────────────────────────────────
  updateStreakInternal(student, now)

  // ── Step 5: Update lastActive ─────────────────────────────────────────────
  student.lastActive = nowIso

  // ── Step 6: Award 5 points per correct answer (max 25 per session) ────────
  const pointsAwarded = Math.max(0, Math.min(25, data.correctCount * 5))
  await addPointsToStudent(data.studentId, pointsAwarded, 'practice', sessionId)

  return { pointsAwarded, student }
}

// ── Mock Paper Service ─────────────────────────────────────────────────────────
// Real-backend implementation when USE_REAL_API=1; falls back to dummy data.
// All function signatures are STABLE — call sites never need to change.

import { DUMMY_MOCK_EXAMS, DUMMY_MOCK_ATTEMPTS } from '@/lib/dummy/pools/mock-exams'
import { readingRawToBand, listeningRawToBand } from '@/lib/scoring/ieltsBands'
import { checkIsCorrect } from '@/lib/scoring/checkIsCorrect'
import { ServiceError } from './errors'
import { USE_REAL_API } from '@/lib/api/env'
import { apiFetch }     from '@/lib/api/client'
import { normalizeOptions } from '@/lib/api/adapters'
import type {
  MockExam,
  MockSectionAttempt,
  MockReadingTest,
  MockListeningTest,
  MockWritingScore,
  Student,
  MockQuestionForFeedback,
} from '@/types/platform'

import { DUMMY_STUDENTS } from '@/lib/dummy/students'

export interface MockReviewDetail {
  attempt: MockSectionAttempt
  mock:    MockExam
  student: Student
}

// ⚠️  TEMPORARY — DEMO / SCREENSHOT MODE for mock listening & writing
// When true, ALL mock-paper reads + attempt operations use dummy data,
// regardless of USE_REAL_API. This lets us demo the mock exam pages against
// the authored `mock-1` fixture while the rest of the app (login, teacher
// portal, students, etc.) continues to hit the real Django backend.
// To restore backend for mocks: set to `false`.
const MOCK_MOCKS_FOR_DEMO = false

// Effective API gate for every function in this file. Replaces the raw
// USE_REAL_API check so the flag above is honoured uniformly.
const shouldUseRealApi = () => USE_REAL_API && !MOCK_MOCKS_FOR_DEMO

// ── Pending reviews ───────────────────────────────────────────────────────────

export async function getPendingMockReviews(): Promise<MockSectionAttempt[]> {
  if (shouldUseRealApi()) {
    return apiFetch<MockSectionAttempt[]>('/api/mock-attempts/pending-review')
  }
  return Promise.resolve(
    DUMMY_MOCK_ATTEMPTS
      .filter(a => a.status === 'submitted' || a.status === 'ai-graded')
      .sort((a, b) => {
        const aTime = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
        const bTime = b.submittedAt ? new Date(b.submittedAt).getTime() : 0
        return bTime - aTime
      })
  )
}

export async function getMockReviewDetail(attemptId: string): Promise<MockReviewDetail | null> {
  if (shouldUseRealApi()) {
    try {
      const attempt  = await apiFetch<MockSectionAttempt>(`/api/mock-attempts/${encodeURIComponent(attemptId)}`)
      const rawMock  = await apiFetch<MockExam>(`/api/mock-papers/${encodeURIComponent(attempt.mockExamId)}`)
      const students = await apiFetch<Student[]>('/api/students')
      const student  = students.find(s => s.id === attempt.studentId)
      if (!student) return null
      return { attempt, mock: adaptMockExam(rawMock), student }
    } catch {
      return null
    }
  }
  const attempt = DUMMY_MOCK_ATTEMPTS.find(a => a.id === attemptId)
  if (!attempt) return null
  const mock    = DUMMY_MOCK_EXAMS.find(m => m.id === attempt.mockExamId)
  if (!mock) return null
  const student = DUMMY_STUDENTS.find(s => s.id === attempt.studentId)
  if (!student) return null
  return Promise.resolve({ attempt, mock, student })
}

// ── Mock Exam catalogue ───────────────────────────────────────────────────────

export async function getMockExams(): Promise<MockExam[]> {
  if (shouldUseRealApi()) {
    const raw = await apiFetch<MockExam[]>('/api/mock-papers')
    return raw.map(adaptMockExam)
  }
  return Promise.resolve(DUMMY_MOCK_EXAMS)
}

/**
 * Listening questions can be MCQ (`mcq-single` / `mcq-multi`) with options in
 * the `{A,B,C}` object shape the backend returns. Normalise them to `string[]`
 * matching the dummy convention.
 * Reading is T/F/NG + short-answer only — no MCQ, so no adapter needed there.
 */
function adaptMockExam(exam: MockExam): MockExam {
  if (!exam.listening) return exam
  return {
    ...exam,
    listening: {
      ...exam.listening,
      questions: exam.listening.questions?.map(normalizeOptions) ?? exam.listening.questions,
    },
  }
}

export async function getMockExam(id: string): Promise<MockExam | null> {
  if (shouldUseRealApi()) {
    try {
      const raw = await apiFetch<MockExam>(`/api/mock-papers/${encodeURIComponent(id)}`)
      return adaptMockExam(raw)
    } catch (err) {
      if (err instanceof ServiceError && err.code === 'NOT_FOUND') return null
      throw err
    }
  }
  return Promise.resolve(DUMMY_MOCK_EXAMS.find(m => m.id === id) ?? null)
}

// ── Student attempt list ──────────────────────────────────────────────────────

export async function getStudentMockAttempts(studentId?: string): Promise<MockSectionAttempt[]> {
  if (shouldUseRealApi()) {
    const url = studentId 
      ? `/api/mock-attempts?studentId=${encodeURIComponent(studentId)}`
      : '/api/mock-attempts'
    return apiFetch<MockSectionAttempt[]>(url)
  }
  const attempts = studentId
    ? DUMMY_MOCK_ATTEMPTS.filter(a => a.studentId === studentId)
    : DUMMY_MOCK_ATTEMPTS
  return Promise.resolve(
    attempts.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  )
}

// ── Single attempt ────────────────────────────────────────────────────────────

export async function getMockSectionAttempt(attemptId: string): Promise<MockSectionAttempt | null> {
  if (shouldUseRealApi()) {
    try {
      return await apiFetch<MockSectionAttempt>(`/api/mock-attempts/${encodeURIComponent(attemptId)}`)
    } catch (err) {
      if (err instanceof ServiceError && err.code === 'NOT_FOUND') return null
      throw err
    }
  }
  return Promise.resolve(DUMMY_MOCK_ATTEMPTS.find(a => a.id === attemptId) ?? null)
}

// ── Create attempt ────────────────────────────────────────────────────────────

export async function createMockSectionAttempt(
  studentId: string,
  mockExamId: string,
  skill: 'reading' | 'listening' | 'writing'
): Promise<MockSectionAttempt> {
  if (shouldUseRealApi()) {
    return apiFetch<MockSectionAttempt>('/api/mock-attempts', {
      method: 'POST',
      json:   { studentId, mockExamId, skill },
    })
  }

  const existing = DUMMY_MOCK_ATTEMPTS.find(
    a => a.studentId === studentId &&
         a.mockExamId === mockExamId &&
         a.skill === skill &&
         (a.status === 'submitted' || a.status === 'ai-graded' || a.status === 'reviewed')
  )
  if (existing && !existing.allowReattempt) {
    throw new ServiceError(`Already attempted ${skill} for ${mockExamId}`, 'INVALID_INPUT')
  }

  const attempt: MockSectionAttempt = {
    id:                      generateUuid(),
    studentId,
    mockExamId,
    skill,
    status:                  'in-progress',
    startedAt:               new Date().toISOString(),
    submittedAt:             null,
    reviewedAt:              null,
    durationSeconds:         0,
    answers:                 {},
    rawScore:                null,
    totalQuestions:          0,
    ieltsBand:               null,
    writingAiScore:          null,
    teacherFinalRawScore:    null,
    teacherFinalBand:        null,
    teacherFinalWritingScore: null,
    teacherFeedback:         null,
    allowReattempt:          false,
  }
  DUMMY_MOCK_ATTEMPTS.push(attempt)
  return Promise.resolve(attempt)
}

// ── Submit attempt ────────────────────────────────────────────────────────────

export async function submitMockSectionAttempt(
  attemptId: string,
  answers: Record<string, string | string[]>,
  durationSeconds: number
): Promise<MockSectionAttempt> {
  if (shouldUseRealApi()) {
    // Backend expects answers as an array of {questionId, answer} objects.
    const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer: Array.isArray(answer) ? answer.join(', ') : answer,
    }))
    return apiFetch<MockSectionAttempt>(`/api/mock-attempts/${encodeURIComponent(attemptId)}/submit`, {
      method: 'POST',
      json:   { answers: answersArray, durationSeconds },
    })
  }

  const attempt = DUMMY_MOCK_ATTEMPTS.find(a => a.id === attemptId)
  if (!attempt) throw new ServiceError('Attempt not found', 'NOT_FOUND')
  if (attempt.status !== 'in-progress') {
    throw new ServiceError(`Attempt is already ${attempt.status}`, 'INVALID_INPUT')
  }

  const exam = DUMMY_MOCK_EXAMS.find(m => m.id === attempt.mockExamId)
  if (!exam) throw new ServiceError('Exam not found', 'NOT_FOUND')

  attempt.answers         = answers
  attempt.durationSeconds = durationSeconds
  attempt.submittedAt     = new Date().toISOString()

  if (attempt.skill === 'reading' && exam.reading) {
    const result = autoGradeReading(exam.reading, answers)
    attempt.rawScore        = result.rawScore
    attempt.totalQuestions  = result.totalQuestions
    attempt.ieltsBand       = readingRawToBand(result.rawScore)
    attempt.aiQuestionFeedback = await generateReadingFeedback(attempt, exam.reading, answers)
    attempt.status          = 'submitted'
  } else if (attempt.skill === 'listening' && exam.listening) {
    const result = autoGradeListening(exam.listening, answers)
    attempt.rawScore        = result.rawScore
    attempt.totalQuestions  = result.totalQuestions
    attempt.ieltsBand       = listeningRawToBand(result.rawScore)
    attempt.aiQuestionFeedback = await generateListeningFeedback(attempt, exam.listening, answers)
    attempt.status          = 'submitted'
  } else if (attempt.skill === 'writing') {
    attempt.totalQuestions = 1
    attempt.status         = 'submitted'
  }

  return Promise.resolve(attempt)
}

// ── Publish (teacher review) ──────────────────────────────────────────────────

export async function publishMockSectionAttempt(
  attemptId: string,
  overrides: {
    teacherFinalRawScore?:     number
    teacherFinalBand?:         number
    teacherFinalWritingScore?: MockWritingScore
    teacherFeedback?:          string
  }
): Promise<MockSectionAttempt> {
  if (shouldUseRealApi()) {
    return apiFetch<MockSectionAttempt>(
      `/api/mock-attempts/${encodeURIComponent(attemptId)}/publish`,
      {
        method: 'POST',
        json:   {
          teacherFinalRawScore:     overrides.teacherFinalRawScore ?? null,
          teacherFinalBand:         overrides.teacherFinalBand ?? null,
          teacherFinalWritingScore: overrides.teacherFinalWritingScore ?? null,
          teacherFeedback:          overrides.teacherFeedback ?? '',
          teacherOverrides:         null,
        },
      }
    )
  }

  const attempt = DUMMY_MOCK_ATTEMPTS.find(a => a.id === attemptId)
  if (!attempt) throw new ServiceError('Attempt not found', 'NOT_FOUND')
  if (attempt.status === 'reviewed') return Promise.resolve(attempt)
  if (attempt.status !== 'submitted' && attempt.status !== 'ai-graded') {
    throw new ServiceError(`Cannot publish attempt in status '${attempt.status}'`, 'INVALID_INPUT')
  }

  attempt.teacherFinalRawScore     = overrides.teacherFinalRawScore    ?? attempt.rawScore
  attempt.teacherFinalBand         = overrides.teacherFinalBand        ?? attempt.ieltsBand
  attempt.teacherFinalWritingScore = overrides.teacherFinalWritingScore ?? attempt.writingAiScore
  attempt.teacherFeedback          = overrides.teacherFeedback          ?? null
  attempt.reviewedAt               = new Date().toISOString()
  attempt.status                   = 'reviewed'

  const { updateStudentSkillScore } = await import('./practice')
  await updateStudentSkillScore(attempt.studentId, attempt.skill)

  // Mock exams are formal assessments, not gamification. No points are awarded
  // on publish — the score/band shown to the student is the reward.

  return Promise.resolve(attempt)
}

// ── Reattempt flag ────────────────────────────────────────────────────────────

export async function setReattemptAllowed(attemptId: string, allowed: boolean): Promise<void> {
  // No backend endpoint yet — keep dummy mutation.
  const attempt = DUMMY_MOCK_ATTEMPTS.find(a => a.id === attemptId)
  if (!attempt) throw new ServiceError('Attempt not found', 'NOT_FOUND')
  attempt.allowReattempt = allowed
}

// ── Score computation helper ──────────────────────────────────────────────────

export function computeSectionScorePercent(attempt: MockSectionAttempt): number | null {
  if (attempt.skill === 'writing') {
    const band = attempt.teacherFinalWritingScore?.bands.overallBand ?? attempt.writingAiScore?.bands.overallBand
    if (band == null) return null
    return Math.round((band / 9) * 100)
  }
  const raw   = attempt.teacherFinalRawScore ?? attempt.rawScore
  const total = attempt.totalQuestions
  if (raw == null || !total) return null
  return Math.round((raw / total) * 100)
}

// ── Private helpers ───────────────────────────────────────────────────────────

async function generateReadingFeedback(
  attempt: MockSectionAttempt,
  reading: MockReadingTest,
  answers: Record<string, string | string[]>
): Promise<Record<string, string> | null> {
  const payload: MockQuestionForFeedback[] = reading.questions.map(q => ({
    questionId:    q.id,
    type:          q.type,
    question:      q.question,
    studentAnswer: answers[q.id] ?? null,
    correctAnswer: q.correctAnswer,
    isCorrect:     checkIsCorrect(q, answers[q.id]),
  }))

  try {
    const res = await fetch('/api/mock-reading-feedback', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ attemptId: attempt.id, questions: payload }),
    })
    if (!res.ok) return null
    const data = await res.json() as { feedback: Record<string, string> }
    return data.feedback
  } catch {
    return null
  }
}

async function generateListeningFeedback(
  attempt: MockSectionAttempt,
  listening: MockListeningTest,
  answers: Record<string, string | string[]>
): Promise<Record<string, string> | null> {
  const payload: MockQuestionForFeedback[] = listening.questions.map(q => ({
    questionId:    q.id,
    type:          q.type,
    question:      q.question,
    studentAnswer: q.type === 'mcq-multi' && Array.isArray(answers[q.id])
      ? JSON.stringify(answers[q.id])
      : (answers[q.id] ?? null),
    correctAnswer: q.type === 'mcq-multi' && Array.isArray(q.correctAnswer)
      ? JSON.stringify(q.correctAnswer)
      : q.correctAnswer,
    isCorrect:     checkIsCorrect(q, answers[q.id]),
  }))

  try {
    const res = await fetch('/api/mock-listening-feedback', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ attemptId: attempt.id, questions: payload }),
    })
    if (!res.ok) return null
    const data = await res.json() as { feedback: Record<string, string> }
    return data.feedback
  } catch {
    return null
  }
}

function autoGradeReading(
  test: MockReadingTest,
  answers: Record<string, string | string[]>
): { rawScore: number; totalQuestions: number } {
  let correct = 0
  for (const q of test.questions) {
    if (checkIsCorrect(q, answers[q.id])) correct++
  }
  return { rawScore: correct, totalQuestions: test.questions.length }
}

function autoGradeListening(
  test: MockListeningTest,
  answers: Record<string, string | string[]>
): { rawScore: number; totalQuestions: number } {
  let correct = 0
  for (const q of test.questions) {
    if (checkIsCorrect(q, answers[q.id])) correct++
  }
  return { rawScore: correct, totalQuestions: test.questions.length }
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

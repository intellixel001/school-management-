/**
 * @file lib/services/reviewHistory.ts
 * @description Unified "review history" view across the teacher portal.
 *
 * Real-backend implementation when USE_REAL_API=1 hits GET /api/review-history.
 * Falls back to in-memory computation from dummy data when USE_REAL_API=0.
 */

import { DUMMY_SESSIONS }                            from '@/lib/dummy/sessions'
import { DUMMY_MOCK_ATTEMPTS, DUMMY_MOCK_EXAMS }      from '@/lib/dummy/pools/mock-exams'
import { DUMMY_STUDENTS }                            from '@/lib/dummy/students'
import { USE_REAL_API }                              from '@/lib/api/env'
import { apiFetch }                                  from '@/lib/api/client'
import type { SkillArea }                            from '@/types/platform'

export type ReviewSource = 'practice' | 'mock'

export interface ReviewHistoryItem {
  id:           string
  source:       ReviewSource
  studentId:    string
  studentName:  string
  studentEmail: string
  skillArea:    SkillArea
  /** ISO timestamp — when feedback was given */
  reviewedAt:   string
  feedbackText: string
  /** Present when source === 'mock' */
  mockId?:      string
  mockTitle?:   string
  /** Routing target for the row's "View" button */
  detailHref:   string
}

export interface ReviewHistoryFilters {
  source?:    ReviewSource | 'all'
  skillArea?: SkillArea | 'all'
  /** ISO — include items reviewed on/after this date */
  since?:     string
}

export async function getReviewHistory(filters?: ReviewHistoryFilters): Promise<ReviewHistoryItem[]> {
  if (USE_REAL_API) {
    const params = new URLSearchParams()
    if (filters?.source    && filters.source    !== 'all') params.set('source', filters.source)
    if (filters?.skillArea && filters.skillArea !== 'all') params.set('skill',  filters.skillArea)
    if (filters?.since) params.set('since', filters.since)
    const qs = params.toString()
    return apiFetch<ReviewHistoryItem[]>(`/api/review-history${qs ? `?${qs}` : ''}`)
  }

  // ── Dummy path ──────────────────────────────────────────────────────────────
  const wantedSource = filters?.source    ?? 'all'
  const wantedSkill  = filters?.skillArea ?? 'all'
  const sinceTime    = filters?.since ? new Date(filters.since).getTime() : 0

  const studentById = new Map(DUMMY_STUDENTS.map(s => [s.id, s]))
  const mockById    = new Map(DUMMY_MOCK_EXAMS.map(m => [m.id, m]))
  const items: ReviewHistoryItem[] = []

  if (wantedSource === 'all' || wantedSource === 'practice') {
    for (const s of DUMMY_SESSIONS) {
      if (s.status !== 'completed') continue
      if (!s.teacherFeedback)       continue
      if (wantedSkill !== 'all' && s.skillArea !== wantedSkill) continue
      const reviewedTime = new Date(s.date).getTime()
      if (sinceTime && reviewedTime < sinceTime) continue
      const student = studentById.get(s.studentId)
      if (!student) continue
      items.push({
        id:           `practice:${s.id}`,
        source:       'practice',
        studentId:    s.studentId,
        studentName:  student.name,
        studentEmail: student.email,
        skillArea:    s.skillArea,
        reviewedAt:   s.date,
        feedbackText: s.teacherFeedback,
        detailHref:   `/teacher/practice-feedback/${s.id}`,
      })
    }
  }

  if (wantedSource === 'all' || wantedSource === 'mock') {
    for (const a of DUMMY_MOCK_ATTEMPTS) {
      if (a.status !== 'reviewed')  continue
      if (!a.teacherFeedback)       continue
      if (!a.reviewedAt)            continue
      if (wantedSkill !== 'all' && a.skill !== wantedSkill) continue
      const reviewedTime = new Date(a.reviewedAt).getTime()
      if (sinceTime && reviewedTime < sinceTime) continue
      const student = studentById.get(a.studentId)
      if (!student) continue
      const mock = mockById.get(a.mockExamId)
      items.push({
        id:           `mock:${a.id}`,
        source:       'mock',
        studentId:    a.studentId,
        studentName:  student.name,
        studentEmail: student.email,
        skillArea:    a.skill,
        reviewedAt:   a.reviewedAt,
        feedbackText: a.teacherFeedback,
        mockId:       a.mockExamId,
        mockTitle:    mock?.title ?? a.mockExamId,
        detailHref:   `/teacher/review/${a.id}`,
      })
    }
  }

  items.sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime())
  return Promise.resolve(items)
}

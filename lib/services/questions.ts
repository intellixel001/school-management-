// ── Questions Service ──────────────────────────────────────────────────────────
// Real-backend implementation when USE_REAL_API=1; falls back to dummy questions.

import { DUMMY_QUESTIONS } from '@/lib/dummy/questions'
import { ServiceError }    from './errors'
import { USE_REAL_API }    from '@/lib/api/env'
import { apiFetch }        from '@/lib/api/client'
import { normalizeOptions } from '@/lib/api/adapters'
import type { Question, SkillArea } from '@/types/platform'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function getQuestionsBySkill(skill: SkillArea): Promise<Question[]> {
  if (USE_REAL_API) {
    const raw = await apiFetch<Question[]>(`/api/questions?skill=${encodeURIComponent(skill)}`)
    return raw.map(normalizeOptions)
  }
  try {
    return Promise.resolve(DUMMY_QUESTIONS.filter(q => q.skillArea === skill))
  } catch {
    throw new ServiceError(`Failed to fetch questions for skill ${skill}`, 'NETWORK_ERROR')
  }
}

/**
 * Quick Quiz is skill-agnostic — always a flat pool of straight multiple-choice
 * questions (no true-false, no fill-blank, no skill filter). See message to
 * backend team in HANDOFF.md for the `/api/questions?type=mcq` contract.
 */
export async function getQuestionsForQuiz(count: number): Promise<Question[]> {
  if (USE_REAL_API) {
    const raw = await apiFetch<Question[]>(`/api/questions?type=mcq&limit=${count}`)
    return raw.map(normalizeOptions)
  }
  try {
    const pool = DUMMY_QUESTIONS.filter(q => q.type === 'mcq')
    return Promise.resolve(shuffle(pool).slice(0, count))
  } catch {
    throw new ServiceError('Failed to fetch quiz questions', 'NETWORK_ERROR')
  }
}

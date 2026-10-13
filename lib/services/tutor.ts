/**
 * @file lib/services/tutor.ts
 * @description AI Tutor chat and student insight services.
 *
 * Endpoints:
 *   POST /api/tutor/chat        — AI tutor chat via Groq LLaMA
 *   GET  /api/student-insight   — AI-generated weekly insight for a student
 */

import { apiFetch }  from '@/lib/api/client'
import { USE_REAL_API } from '@/lib/api/env'
import { ServiceError } from './errors'
import type { SkillArea } from '@/types/platform'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConversationTurn {
  role:    'user' | 'assistant'
  content: string
}

export interface TutorChatInput {
  sessionId?:          string
  message:             string
  studentName?:        string
  studentLevel?:       string
  skill?:              SkillArea | 'general'
  conversationHistory?: ConversationTurn[]
}

export interface TutorChatResponse {
  message:   string
  sessionId: string
}

export interface StudentInsightResponse {
  insight:       string
  suggestedSkill: SkillArea | string
  source:        'groq' | 'fallback'
}

// ── sendTutorMessage ──────────────────────────────────────────────────────────

/**
 * Send a chat message to the AI English tutor and receive a response.
 *
 * POST /api/tutor/chat
 * Rate limited to 30 requests/hour per IP.
 */
export async function sendTutorMessage(input: TutorChatInput): Promise<TutorChatResponse> {
  if (!USE_REAL_API) {
    try {
      const messages = [
        ...(input.conversationHistory ?? []).map(turn => ({
          role: turn.role,
          content: turn.content,
        })),
      ]

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          // /api/chat currently uses a generic tutor prompt. It keeps this
          // field for compatibility but does not read the nested content.
          context: { skillArea: 'speaking', content: {} },
        }),
      })

      if (!response.ok) throw new Error(`Demo tutor returned ${response.status}`)
      const data = await response.json() as { reply?: string }
      if (!data.reply?.trim()) throw new Error('Demo tutor returned an empty reply')

      return {
        message: data.reply.trim(),
        sessionId: input.sessionId || `demo-${Date.now()}`,
      }
    } catch {
      // Keep the voice-tutor demonstration moving even if the optional AI
      // provider is unavailable. The browser can still speak this reply.
      const topic = input.message.trim().replace(/[.!?]+$/, '')
      return {
        message: `That was clear. You said, “${topic}.” Can you tell me one more detail using a complete sentence?`,
        sessionId: input.sessionId || `demo-${Date.now()}`,
      }
    }
  }

  return apiFetch<TutorChatResponse>('/api/tutor/chat', {
    method:   'POST',
    json:     {
      // Omit sessionId entirely when empty so Django creates a new session.
      // Sending "" causes a "This field may not be blank" validation error.
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
      message:             input.message,
      studentName:         input.studentName         ?? 'Student',
      studentLevel:        input.studentLevel        ?? 'entry-1',
      skill:               input.skill              ?? 'general',
      conversationHistory: input.conversationHistory ?? [],
    },
    skipAuth: true,   // public endpoint
  })
}

// ── getStudentInsight ─────────────────────────────────────────────────────────

/**
 * Fetch the AI-generated weekly insight for a student.
 * Cached server-side for 6 hours.
 *
 * GET /api/student-insight?studentId={id}
 */
export async function getStudentInsight(studentId: string): Promise<StudentInsightResponse> {
  if (!studentId) {
    throw new ServiceError('studentId is required', 'BAD_REQUEST')
  }
  return apiFetch<StudentInsightResponse>(
    `/api/student-insight?studentId=${encodeURIComponent(studentId)}`
  )
}

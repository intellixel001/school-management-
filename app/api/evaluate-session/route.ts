// TODO Phase 11 (Django backend): POST /api/evaluate-session
// Request: EvaluateSessionRequest (this file)
// Response: EvaluateSessionResponse (this file)
// Server-side LLM call; persist evaluation alongside Session record.

import { groqChat } from '@/lib/ai/groqChat'
import { NextRequest, NextResponse } from 'next/server'
import { buildEvaluationPrompt } from '@/lib/prompts'
import { INPUT_LIMITS } from '@/lib/security/inputLimits'
import type { SkillArea, SkillLevel } from '@/types/platform'

// ─── Shared types ────────────────────────────────────────────────────────────

export interface EvaluationQuestion {
  id: string
  type: 'mcq' | 'open'
  question: string
  options?: string[]
  correctAnswer?: string
  studentAnswer: string
}

export interface PerQuestionResult {
  questionId: string
  isCorrect: boolean
  feedback: string
}

export interface EvaluateSessionResponse {
  overallScore: number
  correctCount: number
  perQuestion: PerQuestionResult[]
  overallFeedback: string
  vocabSuggestions?: string[]
}

interface EvaluateSessionRequest {
  skillArea: SkillArea
  level: SkillLevel
  contentId: string
  contentText?: string
  questions: EvaluationQuestion[]
}

// ─── Fallback when LLM fails ─────────────────────────────────────────────────

function buildFallback(questions: EvaluationQuestion[]): EvaluateSessionResponse {
  return {
    overallScore: 0,
    correctCount: 0,
    perQuestion: questions.map(q => ({
      questionId: q.id,
      isCorrect: false,
      feedback: 'Could not evaluate — please try again later.',
    })),
    overallFeedback: 'We were unable to evaluate this session. Your answers were recorded but no points were awarded.',
  }
}

// ─── JSON extraction (defensive) ─────────────────────────────────────────────

function extractJSON(raw: string): EvaluateSessionResponse | null {
  // Try 1: direct parse
  try {
    return JSON.parse(raw) as EvaluateSessionResponse
  } catch { /* fall through */ }

  // Try 2: markdown code block extraction
  const mdMatch = raw.match(/```(?:json)?\n([\s\S]+?)\n```/)
  if (mdMatch) {
    try {
      return JSON.parse(mdMatch[1]) as EvaluateSessionResponse
    } catch { /* fall through */ }
  }

  // Try 3: first { ... } block
  const braceMatch = raw.match(/\{[\s\S]*\}/)
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]) as EvaluateSessionResponse
    } catch { /* fall through */ }
  }

  return null
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not set in .env.local' }, { status: 500 })
    }

    const body = await req.json() as EvaluateSessionRequest
    const { skillArea, level, contentText, questions } = body

    if (!skillArea || !level || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Missing required fields: skillArea, level, questions' }, { status: 400 })
    }

    if (questions.length !== 5) {
      return NextResponse.json({ error: `Expected exactly 5 questions, received ${questions.length}` }, { status: 400 })
    }

    // ── Defense-in-depth: server-side payload size enforcement ───────────────
    // These checks run BEFORE the LLM call. A bypassed frontend (curl, devtools)
    // hits these as the unbypassable backstop. Reject with 413, no LLM cost.

    // 1. Per-answer length cap (skill-dependent — writing allows longer answers)
    const perAnswerCap =
      body.skillArea === 'writing'  ? INPUT_LIMITS.WRITING_CANVAS :
      body.skillArea === 'speaking' ? INPUT_LIMITS.SPEAKING_TRANSCRIPT :
                                      INPUT_LIMITS.PRACTICE_OPEN_ANSWER

    const oversizedQuestion = questions.find(q => (q.studentAnswer ?? '').length > perAnswerCap)
    if (oversizedQuestion) {
      return NextResponse.json(
        { error: `Student answer exceeds maximum length of ${perAnswerCap} characters for ${body.skillArea}` },
        { status: 413 }
      )
    }

    // 2. Total payload cap — catches many-short-answers attacks
    const totalAnswerChars = questions.reduce((sum, q) => sum + (q.studentAnswer?.length ?? 0), 0)
    if (totalAnswerChars > INPUT_LIMITS.EVALUATE_SESSION_TOTAL) {
      return NextResponse.json(
        { error: `Total answer payload (${totalAnswerChars} chars) exceeds maximum size` },
        { status: 413 }
      )
    }

    // 3. contentText cap — defensive against maliciously large passage injection
    if ((body.contentText ?? '').length > 10_000) {
      return NextResponse.json(
        { error: `contentText exceeds maximum length of 10,000 characters` },
        { status: 413 }
      )
    }
    // ── End payload validation ───────────────────────────────────────────────

    const systemPrompt = buildEvaluationPrompt(skillArea, level, contentText, questions)

    const { content: rawText, finishReason, model } = await groqChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Evaluate the session and return the JSON object now.' },
      ],
      maxTokens: 4096,      // 5 feedback strings + overall + vocab can exceed 2k
      temperature: 0.3,     // lower temp for deterministic JSON
      jsonMode: true,       // forces valid JSON output
    })

    if (!rawText) {
      console.error('[evaluate-session] Empty LLM response from', model, 'finish_reason:', finishReason)
      return NextResponse.json(buildFallback(questions))
    }

    if (finishReason === 'length') {
      console.warn('[evaluate-session] Response was truncated by max_tokens. Consider raising the limit.')
    }

    const parsed = extractJSON(rawText)

    if (!parsed) {
      console.error('[evaluate-session] Failed to parse LLM JSON. finish_reason:', finishReason)
      console.error('[evaluate-session] Raw response (first 800 chars):', rawText.slice(0, 800))
      return NextResponse.json(buildFallback(questions))
    }

    // Validate shape — ensure perQuestion has entries for all 5 questions
    if (!Array.isArray(parsed.perQuestion) || parsed.perQuestion.length !== 5) {
      console.error('[evaluate-session] perQuestion array malformed. Got length:', parsed.perQuestion?.length)
      console.error('[evaluate-session] Parsed object keys:', Object.keys(parsed))
      return NextResponse.json(buildFallback(questions))
    }

    // Recompute correctCount from perQuestion (don't trust LLM arithmetic)
    const correctCount = parsed.perQuestion.filter(r => r.isCorrect === true).length
    const overallScore = Math.round((correctCount / 5) * 100)

    return NextResponse.json({
      ...parsed,
      correctCount,
      overallScore,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[evaluate-session] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

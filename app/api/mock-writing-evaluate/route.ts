import { groqChat } from '@/lib/ai/groqChat'
import { NextRequest, NextResponse } from 'next/server'
import { buildMockWritingPrompt } from '@/lib/prompts'
import { INPUT_LIMITS } from '@/lib/security/inputLimits'
import { writingBandsToOverall } from '@/lib/scoring/ieltsBands'
import { DUMMY_MOCK_ATTEMPTS, DUMMY_MOCK_EXAMS } from '@/lib/dummy/pools/mock-exams'
import type { MockWritingScore, SkillLevel } from '@/types/platform'
import { USE_REAL_API } from '@/lib/api/env'

// TODO Phase 11 (Django backend):
//   POST /api/mock-writing-evaluate
//   Body: { attemptId, essayText, durationSeconds, level }
//   Backend should:
//     - Validate ownership (attempt belongs to authenticated student)
//     - Validate attempt status (in-progress only)
//     - Compute word count + underlength server-side
//     - Call Groq with the writing prompt
//     - Persist writingAiScore + status='ai-graded' atomically
//     - Return updated attempt

interface RequestBody {
  attemptId: string
  essayText: string
  durationSeconds: number
  level?: SkillLevel // Added from risk flag 2
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RequestBody
    const { attemptId, essayText, durationSeconds, level = 'level-1' } = body

    if (!attemptId || typeof essayText !== 'string') {
      return NextResponse.json({ error: 'attemptId and essayText required' }, { status: 400 })
    }

    const useRealApi = USE_REAL_API
    if (useRealApi) {
      const authHeader = req.headers.get('Authorization')
      const backendBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '')
      const backendUrl = `${backendBaseUrl}/api/mock-attempts/${encodeURIComponent(attemptId)}/evaluate-writing`
      
      const backendRes = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { 'Authorization': authHeader } : {}),
        },
        body: JSON.stringify({ essayText }),
      })
      
      if (!backendRes.ok) {
        const errorText = await backendRes.text()
        console.error('[mock-writing-evaluate] Backend error:', errorText)
        return NextResponse.json({ error: `Backend error: ${backendRes.status}` }, { status: backendRes.status })
      }
      
      const data = await backendRes.json()
      return NextResponse.json({ attempt: data })
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not set' }, { status: 500 })
    }

    // Defense-in-depth length cap (Arch-7 lesson)
    if (essayText.length > INPUT_LIMITS.WRITING_CANVAS) {
      return NextResponse.json(
        { error: `Essay exceeds maximum length of ${INPUT_LIMITS.WRITING_CANVAS} characters` },
        { status: 413 }
      )
    }

    // Browser-side demo attempts live in the client bundle, so a server route
    // cannot always find the same in-memory object. Treat the ID as sufficient
    // in emergency demo mode and use the authored writing paper directly.
    const attempt = DUMMY_MOCK_ATTEMPTS.find(a => a.id === attemptId)
    if (attempt && attempt.skill !== 'writing') {
      return NextResponse.json({ error: 'Attempt is not a writing attempt' }, { status: 400 })
    }
    if (attempt && attempt.status !== 'in-progress' && attempt.status !== 'submitted') {
      return NextResponse.json({ error: `Attempt is ${attempt.status}, cannot evaluate` }, { status: 400 })
    }

    // Find the mock and writing test
    const mock = attempt
      ? DUMMY_MOCK_EXAMS.find(m => m.id === attempt.mockExamId)
      : DUMMY_MOCK_EXAMS.find(m => Boolean(m.writing))
    if (!mock || !mock.writing) {
      return NextResponse.json({ error: 'Writing test content not found' }, { status: 404 })
    }
    const writingTest = mock.writing

    // Compute word count + underlength flag
    const wordCount = essayText.trim().split(/\s+/).filter(Boolean).length
    const underlength = wordCount < writingTest.minWords

    // Build prompt and call Groq
    const systemPrompt = buildMockWritingPrompt(
      level,
      writingTest.prompt,
      writingTest.promptDescription,
      essayText,
      writingTest.minWords
    )

    const { content: rawText, finishReason, model } = await groqChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Evaluate the essay and return the JSON object now.' },
      ],
      maxTokens: 4096,
      temperature: 0.3,
      jsonMode: true,
    })

    if (!rawText) {
      console.error('[mock-writing-evaluate] Empty LLM response from', model, 'finish_reason:', finishReason)
      return NextResponse.json({ error: 'LLM returned empty response' }, { status: 502 })
    }

    if (finishReason === 'length') {
      console.warn('[mock-writing-evaluate] Response truncated by max_tokens')
    }

    // Parse JSON (defensive)
    let parsed: {
      bands: { taskResponse: number; coherenceCohesion: number; lexicalResource: number; grammaticalRange: number }
      flags: { offTopic: boolean; memorised: boolean }
      feedback: string
      bandReasoning?: { taskResponse: string; coherenceCohesion: string; lexicalResource: string; grammaticalRange: string }
    } | null = null

    try {
      parsed = JSON.parse(rawText)
    } catch {
      // Try markdown extraction fallback
      const mdMatch = rawText.match(/```(?:json)?\n([\s\S]+?)\n```/)
      if (mdMatch) {
        try { parsed = JSON.parse(mdMatch[1]) } catch { /* fall through */ }
      }
    }

    if (!parsed || !parsed.bands) {
      console.error('[mock-writing-evaluate] Failed to parse LLM JSON. Raw:', rawText.slice(0, 500))
      return NextResponse.json({ error: 'AI returned unparseable response' }, { status: 502 })
    }

    // Validate band ranges + clamp
    const clampBand = (n: number): number => {
      if (typeof n !== 'number' || isNaN(n)) return 0
      const clamped = Math.max(0, Math.min(9, n))
      return Math.round(clamped * 2) / 2     // round to nearest 0.5
    }

    const bands = {
      taskResponse: clampBand(parsed.bands.taskResponse),
      coherenceCohesion: clampBand(parsed.bands.coherenceCohesion),
      lexicalResource: clampBand(parsed.bands.lexicalResource),
      grammaticalRange: clampBand(parsed.bands.grammaticalRange),
    }
    const overallBand = writingBandsToOverall(bands)

    const writingAiScore: MockWritingScore = {
      bands: { ...bands, overallBand },
      flags: {
        underlength,
        offTopic: Boolean(parsed.flags?.offTopic),
        memorised: Boolean(parsed.flags?.memorised),
      },
      wordCount,
      feedback: typeof parsed.feedback === 'string' ? parsed.feedback : 'No feedback returned.',
      bandReasoning: parsed.bandReasoning,
    }

    // Persist when the server happens to own the same attempt object. The
    // kiosk client already persisted its local submitted attempt before this
    // request, so a missing server copy is expected in demo mode.
    if (attempt) {
      attempt.answers = { essay: essayText }
      attempt.durationSeconds = durationSeconds
      attempt.submittedAt = new Date().toISOString()
      attempt.totalQuestions = 1
      attempt.writingAiScore = writingAiScore
      attempt.status = 'ai-graded'
    }

    return NextResponse.json({
      attempt: attempt ?? {
        id: attemptId,
        status: 'ai-graded',
        answers: { essay: essayText },
        durationSeconds,
        writingAiScore,
      },
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[mock-writing-evaluate] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { groqChat } from '@/lib/ai/groqChat'
import { buildMockReadingFeedbackPrompt } from '@/lib/prompts/mockReadingFeedback'
import type { MockQuestionForFeedback } from '@/types/platform'

interface RequestBody {
  attemptId: string
  questions: MockQuestionForFeedback[]
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    return NextResponse.json({ error: 'questions array required' }, { status: 400 })
  }
  // Sanity cap — protect against runaway inputs
  if (body.questions.length > 30) {
    return NextResponse.json({ error: 'Too many questions in one batch (max 30)' }, { status: 413 })
  }

  try {
    const { content: raw } = await groqChat({
      jsonMode: true,
      temperature: 0.3,
      maxTokens: 1200,
      messages: [
        { role: 'system', content: buildMockReadingFeedbackPrompt() },
        { role: 'user', content: JSON.stringify(body.questions) },
      ],
    })

    let parsed: Record<string, string>
    try {
      parsed = JSON.parse(raw)
    } catch {
      // Markdown fallback — Groq occasionally wraps in ```json
      const cleaned = raw.replace(/```json\s*|\s*```/g, '').trim()
      try {
        parsed = JSON.parse(cleaned)
      } catch {
        return NextResponse.json({ error: 'Malformed AI JSON' }, { status: 502 })
      }
    }

    // Validate shape — every questionId in the request should have an entry
    const out: Record<string, string> = {}
    for (const q of body.questions) {
      const fb = parsed[q.questionId]
      if (typeof fb === 'string' && fb.length > 0 && fb.length <= 250) {
        // Hard 250-char cap — defense against the 18-word rule being ignored
        out[q.questionId] = fb
      } else {
        // Fallback per question: use a generic message
        out[q.questionId] = q.isCorrect
          ? 'Correct.'
          : 'Review this question with your teacher.'
      }
    }

    return NextResponse.json({ feedback: out }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

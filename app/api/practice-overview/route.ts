import { NextRequest, NextResponse } from 'next/server'
import { groqChat } from '@/lib/ai/groqChat'
import { buildPracticeOverviewPrompt } from '@/lib/prompts/practiceOverview'

interface PracticeOverviewRequest {
  skill: string
  level: string
  score: number
  questionsCorrect: number
  questionsAttempted: number
  durationMinutes: number
  /** Student's historical average score for this skill. Null if no prior sessions. */
  studentSkillAverage?: number | null
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
  }

  let body: PracticeOverviewRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Minimal validation — all values are from our data model, not user input
  if (typeof body.skill !== 'string' || typeof body.score !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const { content: raw } = await groqChat({
      temperature: 0.3,
      maxTokens: 100,
      messages: [
        { role: 'system', content: buildPracticeOverviewPrompt() },
        { role: 'user', content: JSON.stringify(body) },
      ],
    })

    // Hard clamp at 250 chars — defense in case the model ignores the word limit
    const overview = raw.length > 250 ? raw.slice(0, 250).trim() + '…' : raw

    return NextResponse.json({
      overview,
      generatedAt: new Date().toISOString(),
    }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI request failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

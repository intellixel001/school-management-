/**
 * @file app/api/tutor/chat/route.ts
 * @description TEMPORARY — handles POST /api/tutor/chat locally via Groq.
 *
 * Why this exists:
 *   The Django backend rejects an empty `sessionId` with "This field may not
 *   be blank." Until that is fixed server-side, this Next.js route handler
 *   intercepts the request (it runs BEFORE the next.config.ts fallback rewrite)
 *   and serves it directly from Groq, generating a UUID session ID when none
 *   is supplied.
 *
 * TODO: Remove this file once Django is updated to accept a missing/null sessionId.
 */

import { groqChat, type ChatMessage } from '@/lib/ai/groqChat'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

// ── System prompt builder ──────────────────────────────────────────────────────

function buildTutorPrompt(level: string, skill: string): string {
  const levelDescriptions: Record<string, string> = {
    'entry-1': 'Entry Level 1 (absolute beginner, very basic vocabulary and simple sentences)',
    'entry-2': 'Entry Level 2 (basic vocabulary, short sentences, familiar topics)',
    'entry-3': 'Entry Level 3 (growing vocabulary, simple conversation, everyday topics)',
    'level-1': 'Level 1 (intermediate, wider vocabulary, can discuss a range of topics)',
  }
  const levelDesc = levelDescriptions[level] ?? level

  return `You are a friendly, encouraging AI English tutor for an adult learner.

Their current level is: ${levelDesc}.
Focus area: ${skill === 'general' ? 'general English conversation' : skill}.

Your role:
- Speak in clear, simple English appropriate for their level.
- Correct grammar mistakes gently and naturally (e.g. "Great! You could also say '...'").
- Keep responses concise — 2-4 sentences maximum. This is a voice conversation.
- Ask one follow-up question to keep the conversation going.
- Never say, repeat, or try to pronounce the learner's name.
- Never ask the learner for their name, even when greeting or starting a new conversation.
- Use a neutral greeting such as "Hello" or "Welcome back" without a name.
- Be warm, patient and encouraging at all times.
- Do NOT use bullet points, lists, or markdown — plain spoken English only.`
}

function sanitizeTutorReply(reply: string, studentName: string): string {
  let sanitized = reply

  // Prompting is the primary control. This response guard ensures the known
  // learner name is never displayed or sent to TTS if the model ignores it.
  const nameParts = studentName.trim().split(/\s+/).filter(part => part.length >= 2)
  for (const part of nameParts) {
    const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    sanitized = sanitized.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), 'there')
  }

  // Replace common name requests with a useful conversation question.
  sanitized = sanitized
    .replace(/(?:what(?:'s| is)|could you tell me|can you tell me|may i (?:know|ask))\s+your name\??/gi, 'What would you like to talk about?')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return sanitized || 'Hello. What would you like to talk about?'
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured.' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const {
      sessionId,
      message,
      studentName    = 'Student',
      studentLevel   = 'entry-1',
      skill          = 'general',
      conversationHistory = [],
    } = body as {
      sessionId?:           string
      message:              string
      studentName?:         string
      studentLevel?:        string
      skill?:               string
      conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    // Generate a new session ID if the client did not supply one.
    const resolvedSessionId = sessionId?.trim() || randomUUID()

    const systemPrompt = buildTutorPrompt(studentLevel, skill)

    // Build Groq messages: system + history + new user message.
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((t) => ({
        role:    t.role as 'user' | 'assistant',
        content: t.content,
      })),
      { role: 'user', content: message.trim() },
    ]

    const { content: rawReply } = await groqChat({
      messages,
      maxTokens:   256,   // keep short — this is voice output
      temperature: 0.7,
    })

    const reply = sanitizeTutorReply(rawReply, studentName)

    return NextResponse.json({ message: reply, sessionId: resolvedSessionId })
  } catch (err: unknown) {
    console.error('[/api/tutor/chat] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

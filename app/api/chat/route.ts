import { groqChat } from '@/lib/ai/groqChat'
import { NextRequest, NextResponse } from 'next/server'
import { buildSystemPrompt, ContentContext } from '@/lib/prompts'
import { Message } from '@/types'

const MESSAGE_MAX = 4_000  // max chars per single message
const TOTAL_MAX   = 20_000 // max chars across all messages in conversation

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, context }: { messages: Message[]; context: ContentContext } = body

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not set in .env.local' },
        { status: 500 }
      )
    }

    // Defense-in-depth: reject oversized chat payloads before any LLM call.
    if (messages.some((m: Message) => (m.content ?? '').length > MESSAGE_MAX)) {
      return NextResponse.json({ error: 'Message too long' }, { status: 413 })
    }
    const total = messages.reduce((s: number, m: Message) => s + (m.content?.length ?? 0), 0)
    if (total > TOTAL_MAX) {
      return NextResponse.json({ error: 'Conversation too long' }, { status: 413 })
    }

    const systemPrompt = buildSystemPrompt(context)

    const groqMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const { content: rawText } = await groqChat({
      messages: groqMessages,
      maxTokens: 1024,
      temperature: 0.7,
    })

    let parsed: { reply?: string; vocab?: string[]; feedback?: unknown[]; score?: number; options?: string[] } = {}

    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      }
    } catch {
      // ignore parse error, fall through to plain text fallback
    }

    const finalReply = (parsed.reply && parsed.reply.trim().length > 0)
      ? parsed.reply.trim()
      : rawText.replace(/\{[\s\S]*\}/g, '').trim() || 'Please go ahead!'

    parsed.reply = finalReply
      .replace(/\{[\s\S]*?\}/g, '')
      .replace(/\[[\s\S]*?\]/g, '')
      .replace(/"[a-z_]+":/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim() || finalReply

    return NextResponse.json(parsed)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

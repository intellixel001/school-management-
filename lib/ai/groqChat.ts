/**
 * @file lib/ai/groqChat.ts
 * @description Single entry point for every Groq chat call, with model fallback.
 *
 * Why this exists: Groq moved Meta's Llama models to Enterprise-only plans, so
 * `llama-3.3-70b-versatile` started returning `model_not_found` on our key and
 * every AI feature broke at once. Hard-coding one model in seven routes meant
 * one upstream change took the whole app down, so model choice now lives here.
 *
 * The chain also covers the free tier's 8K TPM ceiling: when the primary is
 * rate-limited we drop to the next model rather than failing the request.
 *
 * Order is deliberate:
 *   1. qwen/qwen3.8-27b   — returns clean content, never populates `reasoning`,
 *                           and stays correct at small max_tokens.
 *   2. openai/gpt-oss-120b — strong and cheap, but a reasoning model (see below).
 *   3. groq/compound       — different quota pool, heavier prompt overhead.
 *   4. groq/compound-mini  — last resort.
 *
 * Deliberately NOT in the chain: qwen/qwen3.6-27b leaks `<think>…` blocks into
 * `content`, which would corrupt the JSON parsing several routes depend on.
 */

import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export const MODEL_CHAIN = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'groq/compound',
  'groq/compound-mini',
] as const

/**
 * These spend part of the token budget on hidden reasoning before emitting any
 * content — at a tight max_tokens they return an EMPTY string. Verified: at
 * max_tokens 20 gpt-oss-120b returned "" with finish_reason "length". So give
 * them headroom; routes that already ask for more keep their own value.
 */
const REASONING_MODELS = new Set<string>([
  'openai/gpt-oss-120b',
  'groq/compound',
  'groq/compound-mini',
])
const REASONING_TOKEN_FLOOR = 700

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GroqChatParams {
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  /** Set for routes that parse the reply as JSON. All chain models support it. */
  jsonMode?: boolean
}

export interface GroqChatResult {
  /** Trimmed assistant text. Never empty — an empty reply falls through. */
  content: string
  /** Which model actually answered, for logging. */
  model: string
  /** 'length' means the reply was cut off by maxTokens — callers may warn. */
  finishReason: string | null
  /** Models tried and why they were skipped, in order. */
  attempts: { model: string; reason: string }[]
}

/** Only fall through on faults another model could plausibly survive. */
function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number })?.status
  if (status === 429) return true              // rate limited / quota
  if (status === 404) return true              // model gone or no access
  if (status !== undefined && status >= 500) return true  // upstream fault
  return false
}

function describe(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 200)
  return String(err).slice(0, 200)
}

/**
 * Run a chat completion against the first model in the chain that answers.
 * Throws only if every model fails, or on a non-retryable error (e.g. a 400
 * from a malformed request, which is our bug and won't improve on retry).
 */
export async function groqChat(params: GroqChatParams): Promise<GroqChatResult> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set')
  }

  const attempts: { model: string; reason: string }[] = []

  for (const model of MODEL_CHAIN) {
    const maxTokens =
      params.maxTokens !== undefined && REASONING_MODELS.has(model)
        ? Math.max(params.maxTokens, REASONING_TOKEN_FLOOR)
        : params.maxTokens

    try {
      const res = await groq.chat.completions.create({
        model,
        messages:    params.messages,
        temperature: params.temperature,
        max_tokens:  maxTokens,
        ...(params.jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
      })

      const content = res.choices[0]?.message?.content?.trim() ?? ''
      if (!content) {
        // A reasoning model that spent its whole budget thinking. Next one.
        attempts.push({ model, reason: 'empty content' })
        continue
      }

      if (attempts.length > 0) {
        console.warn(
          `[groqChat] fell back to ${model} after: ` +
          attempts.map(a => `${a.model} (${a.reason})`).join(', ')
        )
      }
      return {
        content,
        model,
        finishReason: res.choices[0]?.finish_reason ?? null,
        attempts,
      }
    } catch (err) {
      const reason = describe(err)
      attempts.push({ model, reason })
      if (!isRetryable(err)) throw err
    }
  }

  throw new Error(
    'All Groq models failed. ' +
    attempts.map(a => `${a.model}: ${a.reason}`).join(' | ')
  )
}

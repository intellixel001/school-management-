/**
 * @file hooks/realtime/use-realtime-events.ts
 * @description Subscribes to an RTCDataChannel and maintains derived conversation
 * state from OpenAI Realtime server events.
 *
 * Responsibilities:
 * - Parse incoming data channel messages as `RealtimeEvent` (discriminated union).
 * - Accumulate `ConversationItem[]` from conversation/transcript events.
 * - Derive `SpeakingState` from VAD + audio delta signals.
 * - Surface the last error event to the UI.
 *
 * Design decisions:
 * - Accepts a `RefObject<RTCDataChannel | null>` (not the channel directly) so
 *   the parent hook can imperatively update the ref without causing this hook's
 *   useEffect to re-fire unnecessarily.
 * - `connectionState` is accepted as a dependency so the effect re-runs when the
 *   channel becomes ready (i.e. when connectionState changes to 'connected').
 * - All event parsing uses `unknown` + exhaustive type narrowing — no `any`.
 * - Debug logs are prefixed "[Realtime]" for easy filtering in DevTools.
 *   TODO (Phase 5): remove all console.log calls here.
 */

'use client'

import { useState, useEffect, useCallback, useRef, type RefObject } from 'react'
import { realtimeLog, realtimeWarn } from '@/lib/realtime/logger'
import type {
  RealtimeEvent,
  ConversationItem,
  SpeakingState,
  ConnectionState,
} from '@/types/realtime'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseRealtimeEventsReturn {
  conversationItems: ConversationItem[]
  speakingState: SpeakingState
  error: string | null
  resetConversation: () => void
}

// ─── Type guard ───────────────────────────────────────────────────────────────

/**
 * Narrows an `unknown` value to a `RealtimeEvent` discriminated union.
 * Validates the bare minimum: the parsed value must be a non-null object with
 * a `type` string field. We then rely on the discriminated union narrowing in
 * the switch statement below for deeper field access.
 */
function parseRealtimeEvent(raw: unknown): RealtimeEvent | null {
  if (
    raw === null ||
    typeof raw !== 'object' ||
    !('type' in raw) ||
    typeof (raw as Record<string, unknown>).type !== 'string'
  ) {
    return null
  }
  // We trust OpenAI's wire format here; individual event handlers will access
  // only the fields declared in each interface of the discriminated union.
  return raw as RealtimeEvent
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRealtimeEvents(
  dcRef: RefObject<RTCDataChannel | null>,
  connectionState: ConnectionState
): UseRealtimeEventsReturn {
  const [conversationItems, setConversationItems] = useState<ConversationItem[]>([])
  const [speakingState, setSpeakingState] = useState<SpeakingState>('idle')
  const [error, setError] = useState<string | null>(null)

  // Track which item_id is currently accumulating the assistant transcript so
  // we can append deltas to the correct ConversationItem.
  const currentAssistantItemIdRef = useRef<string | null>(null)

  const resetConversation = useCallback(() => {
    setConversationItems([])
    setSpeakingState('idle')
    setError(null)
    currentAssistantItemIdRef.current = null
  }, [])

  useEffect(() => {
    const dc = dcRef.current
    if (!dc || connectionState !== 'connected') return

    function handleMessage(event: MessageEvent): void {
      let parsed: unknown
      try {
        parsed = JSON.parse(event.data as string)
      } catch {
        realtimeWarn('events', 'Failed to parse data channel message:', event.data)
        return
      }

      const realtimeEvent = parseRealtimeEvent(parsed)
      if (!realtimeEvent) {
        realtimeWarn('events', 'Unrecognised event shape:', parsed)
        return
      }

      realtimeLog('events', 'Event received:', realtimeEvent.type)

      // ── Dispatch on event type ──────────────────────────────────────────────
      switch (realtimeEvent.type) {
        // Session lifecycle
        case 'session.created':
        case 'session.updated':
          // Handled in use-realtime-connection; nothing to do here.
          break

        // VAD: user starts speaking
        case 'input_audio_buffer.speech_started':
          setSpeakingState('user_speaking')
          break

        // VAD: user stops speaking — transition to idle briefly; AI response
        // events will move us to 'ai_speaking' shortly after.
        case 'input_audio_buffer.speech_stopped':
          setSpeakingState('idle')
          break

        // Conversation item created — initialise a ConversationItem for the role
        case 'conversation.item.created': {
          const { id, role } = realtimeEvent.item
          // We only track user and assistant items in the transcript list.
          if (role === 'system') break

          setConversationItems((prev) => {
            // Avoid duplicates if the server fires the event twice
            if (prev.some((item) => item.id === id)) return prev
            return [
              ...prev,
              {
                id,
                role: role as 'user' | 'assistant',
                transcript: '',
                timestamp: new Date(),
              },
            ]
          })

          if (role === 'assistant') {
            currentAssistantItemIdRef.current = id
          }
          break
        }

        // Assistant audio transcript — incremental delta
        case 'response.audio_transcript.delta': {
          const { item_id, delta } = realtimeEvent
          setSpeakingState('ai_speaking')
          setConversationItems((prev) =>
            prev.map((item) =>
              item.id === item_id
                ? { ...item, transcript: item.transcript + delta }
                : item
            )
          )
          break
        }

        // Assistant audio transcript — final, complete string
        case 'response.audio_transcript.done': {
          const { item_id, transcript } = realtimeEvent
          setConversationItems((prev) =>
            prev.map((item) =>
              item.id === item_id ? { ...item, transcript } : item
            )
          )
          break
        }

        // User speech transcription completed (Whisper)
        case 'conversation.item.input_audio_transcription.completed': {
          const { item_id, transcript } = realtimeEvent
          setConversationItems((prev) =>
            prev.map((item) =>
              item.id === item_id
                ? { ...item, transcript }
                : item
            )
          )
          break
        }

        // AI audio started — mark speaking state (may precede transcript deltas)
        case 'response.audio.delta':
          setSpeakingState('ai_speaking')
          break

        // Response complete — return to idle
        case 'response.done':
          setSpeakingState('idle')
          currentAssistantItemIdRef.current = null
          break

        // Server error
        case 'error':
          setError(realtimeEvent.error.message)
          setSpeakingState('idle')
          break

        default:
          realtimeLog('events', 'Unhandled event type:', (realtimeEvent as { type: string }).type)
      }
    }

    dc.addEventListener('message', handleMessage)
    return () => {
      dc.removeEventListener('message', handleMessage)
    }
  }, [dcRef, connectionState])

  return { conversationItems, speakingState, error, resetConversation }
}

/**
 * @file hooks/realtime-qwen/use-qwen-realtime.ts
 * @description WebSocket-based Realtime connection hook for Qwen-Omni-Realtime.
 *
 * Exposes the same shape as the OpenAI version (hooks/realtime/use-realtime-connection.ts)
 * so the page that consumes it can be largely unchanged. Differences from OpenAI:
 *
 *  - Transport is a plain WebSocket (no WebRTC, no SDP exchange).
 *  - Audio is sent manually as base64 PCM16 chunks via `input_audio_buffer.append`.
 *  - Audio responses arrive as base64 PCM16 chunks in `response.audio.delta`
 *    events and are queued for gapless playback.
 *  - The browser does NOT hold an API key — it connects to the local voice-proxy
 *    server (server/voice-proxy.mjs) which forwards to Alibaba with the bearer
 *    key injected.
 *
 * Event schema is OpenAI-compatible (Qwen modelled their wire format after it),
 * so the existing types/realtime.ts event union and the events hook largely
 * apply. Where Qwen-specific events appear they're handled in the message
 * dispatcher below.
 */

'use client'

import { useState, useRef, useCallback, useEffect, type RefObject } from 'react'
import { QWEN_REALTIME_CONFIG } from '@/lib/realtime-qwen/config'
import { floatTo16BitPCM, int16ToBase64, base64PCM16ToFloat32, PlaybackQueue } from '@/lib/realtime-qwen/audio'
import { realtimeLog, realtimeWarn, realtimeError } from '@/lib/realtime/logger'
import type { ConnectionState, ConversationItem, SpeakingState } from '@/types/realtime'

// ─── Reconnection strategy ────────────────────────────────────────────────────

const RECONNECT_DELAYS_MS = [1_000, 2_000, 4_000] as const
const MAX_RECONNECT_ATTEMPTS = 3

// Send audio in ~100ms slices = 1600 samples at 16 kHz. Tunable.
const SEND_CHUNK_SAMPLES = 1600

// ─── Public types ─────────────────────────────────────────────────────────────

export interface UseQwenRealtimeReturn {
  /** Lifecycle state of the WebSocket connection + session. */
  connectionState: ConnectionState
  /** Open the WebSocket, send session config, start streaming mic audio. */
  connect: () => Promise<void>
  /** Cleanly tear down the WebSocket, audio playback, and mic processing. */
  disconnect: () => void
  /** Number of automatic reconnect attempts since the last successful connect. */
  reconnectAttempt: number
  /** Accumulated conversation transcripts (user + assistant). */
  conversationItems: ConversationItem[]
  /** Derived speaking state for UI animations. */
  speakingState: SpeakingState
  /** Last error message surfaced from the API or the WebSocket itself. */
  error: string | null
  /** Reset the conversation transcript list without disconnecting. */
  resetConversation: () => void
  /** Ref to the underlying WebSocket — exposed for compatibility / future use. */
  wsRef: RefObject<WebSocket | null>
  /**
   * Sample the assistant's current audio output amplitude (0..1).
   * Returns 0 when nothing is playing. Used by the orb visualizer.
   */
  getAssistantAmplitude: () => number
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useQwenRealtime(
  micStream: MediaStream | null,
  sessionInstructions: string,
): UseQwenRealtimeReturn {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const [conversationItems, setConversationItems] = useState<ConversationItem[]>([])
  const [speakingState, setSpeakingState] = useState<SpeakingState>('idle')
  const [error, setError] = useState<string | null>(null)

  // ── Refs ────────────────────────────────────────────────────────────────────
  const wsRef = useRef<WebSocket | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const playbackRef = useRef<PlaybackQueue | null>(null)
  const intentionalDisconnectRef = useRef(false)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const currentAssistantItemIdRef = useRef<string | null>(null)
  const instructionsRef = useRef(sessionInstructions)
  useEffect(() => {
    instructionsRef.current = sessionInstructions
  }, [sessionInstructions])

  const clearReconnectTimer = useCallback((): void => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }, [])

  const resetConversation = useCallback((): void => {
    setConversationItems([])
    setSpeakingState('idle')
    setError(null)
    currentAssistantItemIdRef.current = null
  }, [])

  // ── Send helpers ────────────────────────────────────────────────────────────

  const sendJson = useCallback((payload: unknown): void => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(JSON.stringify(payload))
  }, [])

  const sendSessionUpdate = useCallback((): void => {
    // Qwen-Omni-Realtime session.update — spec at
    // https://help.aliyun.com/document_detail/ ... realtime/
    // Notes:
    //  - input_audio_format / output_audio_format MUST be the string "pcm"
    //    (NOT "pcm16" / "pcm24"). Server uses 16 kHz in, 24 kHz out.
    //  - turn_detection: server_vad works for qwen3-omni-flash-realtime;
    //    semantic_vad is recommended only for qwen3.5-* models.
    sendJson({
      type: 'session.update',
      session: {
        modalities: Array.from(QWEN_REALTIME_CONFIG.modalities),
        voice: QWEN_REALTIME_CONFIG.voice,
        instructions: instructionsRef.current,
        input_audio_format: 'pcm',
        output_audio_format: 'pcm',
        turn_detection: {
          type: 'server_vad',
          threshold: QWEN_REALTIME_CONFIG.turn_detection.threshold,
          silence_duration_ms: QWEN_REALTIME_CONFIG.turn_detection.silence_duration_ms,
        },
      },
    })
    realtimeLog('connect', 'Sent session.update')
  }, [sendJson])

  // ── Mic streaming ───────────────────────────────────────────────────────────

  const startMicPipeline = useCallback((): void => {
    if (!micStream) return
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctor()
    audioCtxRef.current = ctx

    const source = ctx.createMediaStreamSource(micStream)
    sourceNodeRef.current = source

    // ScriptProcessorNode is deprecated but still universally supported.
    // A bufferSize of 4096 gives ~85ms slices at 48 kHz, ~256ms at 16 kHz —
    // we re-slice into ~100ms PCM16 frames below.
    const processor = ctx.createScriptProcessor(4096, 1, 1)
    processorRef.current = processor

    const pendingFloat: number[] = []

    processor.onaudioprocess = (ev): void => {
      const input = ev.inputBuffer.getChannelData(0)
      // Downsample + convert to PCM16 in one pass via the helper
      const pcm = floatTo16BitPCM(new Float32Array(input), ctx.sampleRate)
      // Buffer until we have at least SEND_CHUNK_SAMPLES, then flush
      for (let i = 0; i < pcm.length; i++) pendingFloat.push(pcm[i])
      while (pendingFloat.length >= SEND_CHUNK_SAMPLES) {
        const slice = new Int16Array(pendingFloat.splice(0, SEND_CHUNK_SAMPLES))
        const b64 = int16ToBase64(slice)
        sendJson({ type: 'input_audio_buffer.append', audio: b64 })
      }
    }

    source.connect(processor)
    // ScriptProcessor needs a destination connection to fire onaudioprocess
    processor.connect(ctx.destination)
  }, [micStream, sendJson])

  // Hold a stable ref so the message dispatcher can start the mic AFTER
  // the server sends session.created (Qwen rejects audio sent earlier).
  const startMicPipelineRef = useRef<(() => void) | null>(null)

  const stopMicPipeline = useCallback((): void => {
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current.onaudioprocess = null
      processorRef.current = null
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect()
      sourceNodeRef.current = null
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
  }, [])

  // ── Message dispatcher ──────────────────────────────────────────────────────

  const handleMessage = useCallback((event: MessageEvent): void => {
    const data = event.data
    // Browsers deliver text frames as string, binary as Blob/ArrayBuffer.
    // Qwen should send JSON text frames; if we ever get binary, log it and
    // bail so we can diagnose.
    if (typeof data !== 'string') {
      realtimeWarn('events', 'Got non-string WS frame:', data?.constructor?.name)
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(data)
    } catch {
      realtimeWarn('events', 'Failed to parse WS message:', data.slice(0, 200))
      return
    }
    if (!parsed || typeof parsed !== 'object' || !('type' in parsed)) {
      realtimeWarn('events', 'Message without type field:', JSON.stringify(parsed).slice(0, 200))
      return
    }
    const msg = parsed as { type: string } & Record<string, unknown>

    switch (msg.type) {
      case 'session.created': {
        // Server has acknowledged the session. NOW it's safe to start
        // streaming audio — Qwen rejects audio that arrives before this event.
        realtimeLog('events', 'session.created — starting mic pipeline')
        // Adopt the actual server-decided output format/sample rate for the
        // playback queue so PCM decoding matches what Qwen sends.
        const session = msg.session as { output_audio_format?: string } | undefined
        if (session?.output_audio_format) {
          const fmt = session.output_audio_format
          // Qwen uses "pcm24" to mean 16-bit PCM at 24 kHz (NOT 24-bit samples).
          if (fmt === 'pcm24') {
            playbackRef.current?.setSampleRate(24_000)
          } else if (fmt === 'pcm16') {
            playbackRef.current?.setSampleRate(16_000)
          }
        }
        startMicPipelineRef.current?.()
        break
      }
      case 'session.updated':
        break

      case 'input_audio_buffer.speech_started':
        // User started talking — interrupt any AI playback
        playbackRef.current?.stop()
        setSpeakingState('user_speaking')
        break

      case 'input_audio_buffer.speech_stopped':
        setSpeakingState('idle')
        break

      case 'conversation.item.created': {
        const item = msg.item as { id: string; role: string } | undefined
        if (!item || item.role === 'system') break
        setConversationItems((prev) => {
          if (prev.some((i) => i.id === item.id)) return prev
          return [
            ...prev,
            {
              id: item.id,
              role: item.role as 'user' | 'assistant',
              transcript: '',
              timestamp: new Date(),
            },
          ]
        })
        if (item.role === 'assistant') currentAssistantItemIdRef.current = item.id
        break
      }

      case 'response.audio.delta': {
        const b64 = msg.delta as string | undefined
        if (typeof b64 !== 'string') break
        const pcm = base64PCM16ToFloat32(b64)
        playbackRef.current?.enqueue(pcm)
        setSpeakingState('ai_speaking')
        break
      }

      case 'response.audio_transcript.delta': {
        const itemId = msg.item_id as string | undefined
        const delta = msg.delta as string | undefined
        if (!itemId || typeof delta !== 'string') break
        setConversationItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, transcript: i.transcript + delta } : i)),
        )
        setSpeakingState('ai_speaking')
        break
      }

      case 'response.audio_transcript.done': {
        const itemId = msg.item_id as string | undefined
        const transcript = msg.transcript as string | undefined
        if (!itemId || typeof transcript !== 'string') break
        setConversationItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, transcript } : i)))
        break
      }

      case 'conversation.item.input_audio_transcription.completed': {
        const itemId = msg.item_id as string | undefined
        const transcript = msg.transcript as string | undefined
        if (!itemId || typeof transcript !== 'string') break
        setConversationItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, transcript } : i)))
        break
      }

      case 'response.done':
        setSpeakingState('idle')
        currentAssistantItemIdRef.current = null
        break

      case 'error': {
        const errObj = msg.error as { message?: string } | undefined
        const message = errObj?.message ?? 'Qwen Realtime error'
        realtimeError('events', message)
        setError(message)
        setSpeakingState('idle')
        break
      }

      default:
        realtimeLog('events', 'Unhandled event:', msg.type)
    }
  }, [])

  // ── Teardown ────────────────────────────────────────────────────────────────

  const teardown = useCallback((): void => {
    stopMicPipeline()
    if (playbackRef.current) {
      void playbackRef.current.dispose()
      playbackRef.current = null
    }
    if (wsRef.current) {
      try {
        wsRef.current.close()
      } catch {
        // already closed
      }
      wsRef.current = null
    }
  }, [stopMicPipeline])

  // ── Connect ─────────────────────────────────────────────────────────────────

  const scheduleReconnectRef = useRef<() => void>(() => {})

  const connect = useCallback(async (): Promise<void> => {
    if (connectionState === 'connecting' || connectionState === 'connected') {
      realtimeWarn('connect', 'Already connecting/connected')
      return
    }
    if (!micStream) {
      realtimeError('connect', 'No mic stream — cannot connect')
      setConnectionState('error')
      setError('Microphone unavailable')
      return
    }

    setConnectionState('connecting')
    intentionalDisconnectRef.current = false

    try {
      // Qwen output is PCM @ 24 kHz regardless of what we ask for. The
      // session.created handler will reaffirm this from the server response.
      playbackRef.current = new PlaybackQueue(24_000)

      const ws = new WebSocket(QWEN_REALTIME_CONFIG.proxyUrl)
      wsRef.current = ws

      ws.onopen = (): void => {
        realtimeLog('connect', 'WS open — sending session.update (mic waits for session.created)')
        reconnectAttemptRef.current = 0
        setReconnectAttempt(0)
        setConnectionState('connected')
        startMicPipelineRef.current = startMicPipeline
        sendSessionUpdate()
        // NOTE: do NOT start mic here. The dispatcher starts it on session.created.
      }

      ws.onmessage = handleMessage

      ws.onerror = (ev): void => {
        realtimeError('connect', 'WS error', ev)
      }

      ws.onclose = (ev): void => {
        realtimeLog('connect', `WS closed: ${ev.code} ${ev.reason}`)
        stopMicPipeline()
        playbackRef.current?.stop()
        if (intentionalDisconnectRef.current) {
          setConnectionState('disconnected')
        } else {
          setConnectionState('connecting')
          scheduleReconnectRef.current()
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to open WebSocket'
      realtimeError('connect', message)
      setError(message)
      teardown()
      if (!intentionalDisconnectRef.current) {
        scheduleReconnectRef.current()
      } else {
        setConnectionState('error')
      }
    }
  }, [connectionState, micStream, sendSessionUpdate, startMicPipeline, stopMicPipeline, handleMessage, teardown])

  // ── Reconnection ────────────────────────────────────────────────────────────

  const connectRef = useRef(connect)
  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  const scheduleReconnect = useCallback((): void => {
    clearReconnectTimer()
    const attempt = reconnectAttemptRef.current
    if (attempt >= MAX_RECONNECT_ATTEMPTS) {
      realtimeError('reconnect', `Max attempts (${MAX_RECONNECT_ATTEMPTS}) reached`)
      setConnectionState('error')
      reconnectAttemptRef.current = 0
      setReconnectAttempt(0)
      return
    }
    const delay = RECONNECT_DELAYS_MS[attempt] ?? RECONNECT_DELAYS_MS[RECONNECT_DELAYS_MS.length - 1]
    realtimeLog('reconnect', `Attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`)
    reconnectAttemptRef.current = attempt + 1
    setReconnectAttempt(attempt + 1)
    setConnectionState('connecting')
    reconnectTimerRef.current = setTimeout(() => connectRef.current(), delay)
  }, [clearReconnectTimer])

  useEffect(() => {
    scheduleReconnectRef.current = scheduleReconnect
  }, [scheduleReconnect])

  // ── Disconnect ──────────────────────────────────────────────────────────────

  const disconnect = useCallback((): void => {
    realtimeLog('connect', 'User-initiated disconnect')
    intentionalDisconnectRef.current = true
    clearReconnectTimer()
    reconnectAttemptRef.current = 0
    setReconnectAttempt(0)
    teardown()
    setConnectionState('disconnected')
    setTimeout(() => {
      intentionalDisconnectRef.current = false
    }, 0)
  }, [clearReconnectTimer, teardown])

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      intentionalDisconnectRef.current = true
      clearReconnectTimer()
      teardown()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getAssistantAmplitude = useCallback((): number => {
    return playbackRef.current?.getAmplitude() ?? 0
  }, [])

  return {
    connectionState,
    connect,
    disconnect,
    reconnectAttempt,
    conversationItems,
    speakingState,
    error,
    resetConversation,
    wsRef,
    getAssistantAmplitude,
  }
}

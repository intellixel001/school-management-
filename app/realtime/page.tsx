/**
 * @file app/realtime/page.tsx
 * @description Phase 5 — hardened, demo-ready Realtime voice practice interface.
 *
 * Layout:
 *   ┌─ RealtimeHeader ──────────────────────────────────┐
 *   │  ErrorBanner (below header, slides in)             │
 *   │  ConversationDisplay (flex-grow, scrollable)       │
 *   │             VoiceOrb  (centered)                   │
 *   │          ConnectionControls                        │
 *   └────────────────────────────────────────────────────┘
 *
 * Phase 5 additions:
 * - ErrorBanner system: categorises mic, network, WebRTC, and rate-limit errors.
 * - Wires reconnectAttempt → ConnectionControls for in-progress feedback.
 * - Wires getConnectionQuality → RealtimeHeader for RTT indicator.
 * - Mic-permission guard uses pendingConnectRef (preserved from Phase 3).
 * - connect() call deferred until stream is non-null (useEffect guard).
 * - onBeforeNavigate: confirms + disconnects before toggling to Manual mode.
 *
 * Isolation: zero imports from the Groq pipeline outside realtime/ subdirectories.
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useMicrophone }         from '@/hooks/realtime/use-microphone'
import { useRealtimeConnection, DEFAULT_SESSION_INSTRUCTIONS } from '@/hooks/realtime/use-realtime-connection'
import { useRealtimeEvents }     from '@/hooks/realtime/use-realtime-events'

import { RealtimeHeader }    from './_components/realtime-header'
import { ConversationDisplay } from './_components/conversation-display'
import { VoiceOrb, type OrbPageState } from './_components/voice-orb'
import { ConnectionControls } from './_components/connection-controls'
import { ErrorBanner, type RealtimeErrorItem } from './_components/error-banner'

import type { ConnectionState } from '@/types/realtime'
import type { MicPermissionState } from '@/hooks/realtime/use-microphone'

// ─── Page state derivation ────────────────────────────────────────────────────

function derivePageState(
  connectionState: ConnectionState,
  permissionState: MicPermissionState
): OrbPageState {
  if (connectionState === 'error') return 'error'
  if (permissionState === 'denied' || permissionState === 'error') return 'error'
  if (connectionState === 'connecting') return 'connecting'
  if (connectionState === 'connected')  return 'connected'
  return 'ready'
}

// ─── Error message factory ────────────────────────────────────────────────────

let errorCounter = 0
function makeError(
  message: string,
  opts?: { persistent?: boolean; onRetry?: () => void }
): RealtimeErrorItem {
  return { id: String(++errorCounter), message, ...opts }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RealtimePage() {
  // ── Hooks ────────────────────────────────────────────────────────────────
  const { stream, permissionState, requestPermission } = useMicrophone()
  const {
    connectionState,
    connect,
    disconnect,
    dcRef,
    reconnectAttempt,
    getConnectionQuality,
  } = useRealtimeConnection(stream, DEFAULT_SESSION_INSTRUCTIONS)
  const { conversationItems, speakingState, error: dcError, resetConversation } =
    useRealtimeEvents(dcRef, connectionState)

  // ── Error banner state ────────────────────────────────────────────────────
  const [errors, setErrors] = useState<RealtimeErrorItem[]>([])

  const pushError = useCallback((item: RealtimeErrorItem) => {
    setErrors((prev) => {
      // Deduplicate by message
      if (prev.some((e) => e.message === item.message)) return prev
      return [...prev, item]
    })
  }, [])

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id))
  }, [])

  // Surface mic denied error
  useEffect(() => {
    if (permissionState === 'denied' || permissionState === 'error') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      pushError(makeError(
        'Microphone access is required. Please allow mic access in your browser settings.'
      ))
    }
  }, [permissionState, pushError])

  // Surface data channel errors from useRealtimeEvents
  useEffect(() => {
    if (!dcError) return
    // Map common OpenAI error keywords to user-friendly messages
    let message = 'Communication error. Reconnecting…'
    if (/rate.?limit|quota/i.test(dcError)) {
      message = 'Service temporarily unavailable. Please try again in a moment.'
    } else if (/token|auth|key/i.test(dcError)) {
      message = 'Unable to connect to the server. Please check your configuration.'
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    pushError(makeError(message))
  }, [dcError, pushError])

  // Surface WebRTC connection failure after retries exhausted
  const prevConnectionState = useRef<ConnectionState>('disconnected')
  useEffect(() => {
    const prev = prevConnectionState.current
    prevConnectionState.current = connectionState
    if (connectionState === 'error' && prev !== 'error') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      pushError(makeError(
        'Connection lost. Please try again.',
        {
          persistent: true,
          onRetry: () => {
            setErrors([])
            void connect()
          },
        }
      ))
    }
  }, [connectionState, connect, pushError])

  // ── Mic-permission race condition guard ───────────────────────────────────
  const pendingConnectRef = useRef(false)

  useEffect(() => {
    if (pendingConnectRef.current && stream !== null && connectionState === 'disconnected') {
      pendingConnectRef.current = false
      void connect()
    }
  }, [stream, connectionState, connect])

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleConnect() {
    if (permissionState === 'granted' && stream !== null) {
      await connect()
    } else if (permissionState !== 'denied' && permissionState !== 'error') {
      pendingConnectRef.current = true
      await requestPermission()
    }
  }

  function handleDisconnect() {
    disconnect()
    resetConversation()
  }

  // ── Mode-toggle navigation guard ──────────────────────────────────────────
  const onBeforeNavigate = useCallback((): boolean => {
    if (connectionState !== 'connected' && connectionState !== 'connecting') return true
    const confirmed = window.confirm('This will end your current conversation. Switch modes?')
    if (!confirmed) return false
    disconnect()
    resetConversation()
    return true
  }, [connectionState, disconnect, resetConversation])

  // ── Derived state ─────────────────────────────────────────────────────────
  const pageState = derivePageState(connectionState, permissionState)

  return (
    <div className="h-dvh flex flex-col bg-brand-bg overflow-hidden">

      {/* Ambient glow */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] max-w-[600px] max-h-[600px] rounded-full bg-brand-primary opacity-[0.07] blur-[120px]" />
      </div>

      {/* Header */}
      <RealtimeHeader
        connectionState={connectionState}
        getConnectionQuality={getConnectionQuality}
        onBeforeNavigate={onBeforeNavigate}
      />

      {/* Error banner (below header, slides in) */}
      <ErrorBanner errors={errors} onDismiss={dismissError} />

      {/* Conversation transcript */}
      <ConversationDisplay
        conversationItems={conversationItems}
        isConnected={pageState === 'connected'}
        speakingState={speakingState}
      />

      {/* Bottom dock */}
      <footer className="flex-shrink-0 flex flex-col items-center gap-5 pb-8 pt-4 px-6 border-t border-white/[0.04]"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        <VoiceOrb speakingState={speakingState} pageState={pageState} />
        <ConnectionControls
          pageState={pageState}
          permissionState={permissionState}
          reconnectAttempt={reconnectAttempt}
          onConnect={() => { void handleConnect() }}
          onDisconnect={handleDisconnect}
          onRetry={() => { setErrors([]); void connect() }}
        />
      </footer>

    </div>
  )
}

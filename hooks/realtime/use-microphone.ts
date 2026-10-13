/**
 * @file hooks/realtime/use-microphone.ts
 * @description Manages microphone stream acquisition and permission state.
 *
 * Design decisions:
 * - Permission is NOT requested on mount. Call `requestPermission()` explicitly
 *   (e.g. on a user gesture) to avoid the browser permission prompt appearing
 *   before the user has interacted with the page.
 * - The MediaStream is stored in a ref (not state) so that re-renders triggered
 *   by permissionState updates do not recreate the stream reference.
 * - Cleanup on unmount stops all tracks so the browser's "mic in use" indicator
 *   is dismissed and no ghost streams are left open.
 *
 * This hook is intentionally decoupled from WebRTC — it only manages the raw
 * MediaStream. The connection hook consumes it via `stream`.
 */

'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'error'

export interface UseMicrophoneReturn {
  stream: MediaStream | null
  permissionState: MicPermissionState
  requestPermission: () => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMicrophone(): UseMicrophoneReturn {
  const [permissionState, setPermissionState] =
    useState<MicPermissionState>('prompt')

  // Store the stream in a ref to avoid triggering re-renders when it changes
  // internally (e.g. track mute/unmute). The `stream` returned to callers is
  // stable for the lifetime of the granted session.
  const streamRef = useRef<MediaStream | null>(null)

  // Also expose as state so callers re-render when the stream becomes available.
  const [stream, setStream] = useState<MediaStream | null>(null)

  const requestPermission = useCallback(async (): Promise<void> => {
    // Guard: don't open a second stream if one is already active.
    if (streamRef.current) return

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })
      streamRef.current = mediaStream
      setStream(mediaStream)
      setPermissionState('granted')
    } catch (err: unknown) {
      if (
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
      ) {
        setPermissionState('denied')
      } else {
        setPermissionState('error')
      }
    }
  }, [])

  // Cleanup: stop all tracks on unmount so the browser "mic active" indicator
  // disappears and no background capture continues.
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  return { stream, permissionState, requestPermission }
}

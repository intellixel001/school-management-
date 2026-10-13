'use client'

import { useEffect, useState, useRef } from 'react'
import { speakText, stopSpeaking } from '@/lib/speechUtils'
import type { MockListeningRecording } from '@/types/platform'
import { Play, Square, SkipBack, SkipForward } from 'lucide-react'

interface AudioPlayerProps {
  recordings: MockListeningRecording[]
  currentIndex: number
  onAdvance: () => void
  onPrevious: () => void
  audioState: 'idle' | 'playing' | 'paused' | 'finished'
  onAudioStateChange: (state: 'idle' | 'playing' | 'paused' | 'finished') => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ recordings, currentIndex, onAdvance, onPrevious, audioState, onAudioStateChange }: AudioPlayerProps) {
  const [elapsedSec, setElapsedSec] = useState(0)
  const elapsedRef = useRef(0)
  
  const recording = recordings[currentIndex]

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  // Progress ticker
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    if (audioState === 'playing') {
      interval = setInterval(() => {
        elapsedRef.current += 0.1
        setElapsedSec(elapsedRef.current)
      }, 100)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [audioState])

  // Reset on recording change
  useEffect(() => {
    stopSpeaking()
    onAudioStateChange('idle')
    elapsedRef.current = 0
    setElapsedSec(0)
  }, [currentIndex, onAudioStateChange])

  if (!recording) return null

  function play() {
    if (!recording) return
    // Always restart from the beginning. Browser TTS has no reliable pause/resume
    // (Chrome's speechSynthesis.pause() is broken for utterances > ~15s), so we
    // don't pretend it does — each Play click cancels any current speech and
    // starts fresh from the top.
    stopSpeaking()
    elapsedRef.current = 0
    setElapsedSec(0)
    onAudioStateChange('playing')
    speakText(
      recording.audioScript,
      () => {}, // onStart
      () => {
        onAudioStateChange('finished')
        elapsedRef.current = recording.estimatedDurationSec
        setElapsedSec(recording.estimatedDurationSec)
      }
    )
  }

  function stop() {
    stopSpeaking()
    elapsedRef.current = 0
    setElapsedSec(0)
    onAudioStateChange('idle')
  }

  const estimated = recording.estimatedDurationSec || 120
  const progressPercent = Math.min((elapsedSec / estimated) * 100, 100)
  
  const isLast  = currentIndex === recordings.length - 1
  const isFirst = currentIndex === 0
  const canStop = audioState === 'playing'

  return (
    <div className="bg-white rounded-[24px] p-12 shadow-sm border border-black/10">
      <p className="font-mono text-gray-500 mb-2 uppercase tracking-wider" style={{ fontSize: 15 }}>
        Recording {currentIndex + 1} of {recordings.length}
      </p>
      <h3 className="font-display font-semibold text-gray-900 mb-10" style={{ fontSize: 30 }}>
        {recording.title || `Recording ${currentIndex + 1}`}
      </h3>

      <div className="flex items-center justify-between gap-6 mb-10">
        {/* Playback: Play (restart) + Stop */}
        <div className="flex items-center gap-5">
          <button
            onClick={play}
            className="rounded-full flex items-center justify-center text-white transition-transform active:scale-95"
            style={{ width: 96, height: 96, background: 'var(--accent-primary)' }}
            title="Play (starts from beginning)"
          >
            <Play size={40} fill="currentColor" className="ml-1" />
          </button>

          <button
            onClick={stop}
            disabled={!canStop}
            className="rounded-[18px] flex items-center justify-center transition-transform active:scale-95"
            style={{
              width: 84, height: 84,
              background: canStop ? '#FEE2E2' : 'rgba(0,0,0,0.04)',
              color: canStop ? '#DC2626' : 'rgba(0,0,0,0.25)',
              cursor: canStop ? 'pointer' : 'not-allowed',
            }}
            title="Stop"
          >
            <Square size={30} fill="currentColor" />
          </button>
        </div>

        {/* Navigation: Previous + Next */}
        <div className="flex items-center gap-5">
          <button
            onClick={onPrevious}
            disabled={isFirst}
            className="rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{
              width: 84, height: 84,
              background: isFirst ? 'rgba(0,0,0,0.04)' : '#f3f4f6',
              color:      isFirst ? 'rgba(0,0,0,0.2)'   : '#374151',
              cursor:     isFirst ? 'not-allowed'       : 'pointer',
            }}
            title="Previous recording"
          >
            <SkipBack size={34} fill="currentColor" />
          </button>

          <button
            onClick={onAdvance}
            disabled={isLast}
            className="rounded-full flex items-center justify-center transition-transform active:scale-95"
            style={{
              width: 84, height: 84,
              background: isLast ? 'rgba(0,0,0,0.04)' : '#f3f4f6',
              color:      isLast ? 'rgba(0,0,0,0.2)'  : '#374151',
              cursor:     isLast ? 'not-allowed'      : 'pointer',
            }}
            title="Next recording"
          >
            <SkipForward size={34} fill="currentColor" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex-1 bg-gray-100 rounded-full overflow-hidden relative" style={{ height: 16 }}>
          <div
            className="absolute top-0 left-0 bottom-0 transition-all duration-100 linear"
            style={{
              width: `${progressPercent}%`,
              background: 'var(--accent-primary)'
            }}
          />
        </div>
        <div className="font-mono text-gray-500 text-right" style={{ fontSize: 22, minWidth: 160 }}>
          {formatTime(elapsedSec)} / {formatTime(estimated)}
        </div>
      </div>

      <div className="mt-6 font-mono font-medium" style={{ fontSize: 16, color: audioState === 'playing' ? 'var(--accent-primary)' : '#6b7280' }}>
        STATUS: {audioState.charAt(0).toUpperCase() + audioState.slice(1)}
      </div>
    </div>
  )
}

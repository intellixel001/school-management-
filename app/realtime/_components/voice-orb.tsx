/**
 * @file app/realtime/_components/voice-orb.tsx
 * @description Central hero visual element for the Realtime voice interface.
 * The orb reflects the current pipeline state through gradient color, glow
 * intensity, and CSS animation — no JS animation libraries used.
 *
 * State → visual mapping:
 *  idle/ready     → muted purple gradient, slow breathe animation
 *  connecting     → amber gradient, faster breathe animation
 *  user_speaking  → sky/cyan gradient, fast scale pulse + ring expand
 *  ai_speaking    → emerald gradient, medium scale pulse + ring expand
 *  error          → red gradient, no animation
 *
 * Animations are suppressed via CSS for users who prefer reduced motion
 * (handled in globals.css via @media prefers-reduced-motion).
 *
 * The orb is a PURELY VISUAL element — not interactive. VAD drives turn-taking.
 */

'use client'

import type { SpeakingState } from '@/types/realtime'

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrbPageState = 'ready' | 'connecting' | 'connected' | 'error'

interface VoiceOrbProps {
  speakingState: SpeakingState
  pageState: OrbPageState
}

// ─── Style maps ───────────────────────────────────────────────────────────────

/** Derives the inner orb's gradient + glow based on compound state. */
function getOrbStyles(
  pageState: OrbPageState,
  speakingState: SpeakingState
): { gradient: string; shadow: string; animate: string } {
  if (pageState === 'error') {
    return {
      gradient: 'bg-[radial-gradient(ellipse_at_60%_30%,#f87171,#dc2626)]',
      shadow: 'shadow-[0_0_40px_rgba(239,68,68,0.5),0_0_80px_rgba(239,68,68,0.2)]',
      animate: '',
    }
  }
  if (pageState === 'connecting') {
    return {
      gradient: 'bg-[radial-gradient(ellipse_at_60%_30%,#fcd34d,#f59e0b)]',
      shadow: 'shadow-[0_0_40px_rgba(245,158,11,0.5),0_0_80px_rgba(245,158,11,0.2)]',
      animate: 'animate-orb-connecting',
    }
  }
  if (speakingState === 'user_speaking') {
    return {
      gradient: 'bg-[radial-gradient(ellipse_at_60%_30%,#67e8f9,#0ea5e9)]',
      shadow: 'shadow-[0_0_50px_rgba(14,165,233,0.6),0_0_100px_rgba(14,165,233,0.25)]',
      animate: 'animate-orb-user',
    }
  }
  if (speakingState === 'ai_speaking') {
    return {
      gradient: 'bg-[radial-gradient(ellipse_at_60%_30%,#6ee7b7,#10b981)]',
      shadow: 'shadow-[0_0_50px_rgba(16,185,129,0.6),0_0_100px_rgba(16,185,129,0.25)]',
      animate: 'animate-orb-ai',
    }
  }
  // idle / ready / connected-idle
  return {
    gradient: 'bg-[radial-gradient(ellipse_at_60%_30%,#c084fc,#7c3aed)]',
    shadow: 'shadow-[0_0_40px_rgba(124,58,237,0.45),0_0_80px_rgba(124,58,237,0.18)]',
    animate: 'animate-orb-idle',
  }
}

/** Ring color shown during speech states. */
function getRingClass(speakingState: SpeakingState): string {
  if (speakingState === 'user_speaking') return 'border-sky-400/50 animate-orb-ring'
  if (speakingState === 'ai_speaking') return 'border-emerald-400/50 animate-orb-ring'
  return 'border-transparent'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VoiceOrb({ speakingState, pageState }: VoiceOrbProps) {
  const { gradient, shadow, animate } = getOrbStyles(pageState, speakingState)
  const ringClass = getRingClass(speakingState)

  return (
    <div
      aria-hidden="true"
      className="relative mb-5 flex items-center justify-center w-44 h-44 sm:w-48 sm:h-48"
    >
      {/* Expanding ring — visible during speech (absolutely positioned behind orb) */}
      <div
        className={[
          'absolute inset-[-10px] rounded-full border-2 transition-colors duration-500',
          ringClass,
        ].join(' ')}
      />

      {/* Outer diffuse glow layer */}
      <div
        className={[
          'absolute inset-0 rounded-full blur-xl opacity-40 transition-all duration-500',
          gradient,
        ].join(' ')}
      />

      {/* Main orb body */}
      <div
        className={[
          'relative w-full h-full rounded-full transition-all duration-500',
          gradient,
          shadow,
          animate,
        ].join(' ')}
      >
        {/* Inner glass highlight — top-left specular */}
        <div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 blur-md pointer-events-none" />
        {/* Subtle inner ring */}
        <div className="absolute inset-3 rounded-full border border-white/10 pointer-events-none" />
      </div>
    </div>
  )
}

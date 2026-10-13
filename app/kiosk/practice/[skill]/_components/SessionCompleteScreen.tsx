'use client'

import { useEffect, useRef } from 'react'
import type { SkillArea } from '@/types/platform'
import { SKILL_CONFIG } from '@/lib/skillConfig'
import { Button } from '@/components/ui'
import { RotateCcw, Home, CheckCircle, XCircle, Award } from 'lucide-react'
import PointsEarnedBadge from '@/app/_components/PointsEarnedBadge'
import { speakText, stopSpeaking } from '@/lib/speechUtils'
import type { EvaluateSessionResponse } from '@/app/api/evaluate-session/route'

interface SessionCompleteScreenProps {
  skill: SkillArea
  exchangeCount: number
  elapsedSeconds: number
  lastFeedback?: string
  /** First name of the logged-in kiosk student, for the greeting. */
  studentFirstName?: string
  /** Points awarded this session — null if service call failed or no session. */
  pointsAwarded: number | null
  /** Running total after this award — null if service call failed. */
  updatedTotalPoints: number | null
  onPractiseAgain: () => void
  onBackToMenu: () => void
  /** NEW — full evaluation from /api/evaluate-session. When present, render the breakdown. */
  evaluation?: EvaluateSessionResponse | null
  /** The original question texts mapped by id — for the breakdown display. */
  questionTexts?: Record<string, string>
  /** The student's answers mapped by question id. */
  studentAnswers?: Record<string, string>
  /** Set when the session ended automatically (idle timeout or hard cap). */
  autoEndReason?: 'idle' | 'cap' | null
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function SessionCompleteScreen({
  skill, exchangeCount, elapsedSeconds, lastFeedback,
  studentFirstName, pointsAwarded, updatedTotalPoints,
  onPractiseAgain, onBackToMenu,
  evaluation, questionTexts, studentAnswers,
  autoEndReason,
}: SessionCompleteScreenProps) {
  const config = SKILL_CONFIG[skill]
  const Icon = config.icon
  const accentColor = config.iconColor || 'var(--accent-primary)'

  const showPoints = pointsAwarded !== null && updatedTotalPoints !== null

  // ─── AI tutor voice: read the overall feedback out loud ─────────────────
  //
  // Fires ONCE per feedback string. Locked by a ref keyed on the feedback
  // text so navigating away and back with the same string won't re-trigger,
  // and switching sessions with new feedback DOES trigger. Any pending
  // speech is cancelled on unmount so leaving the screen stops the voice.
  const spokenForRef = useRef<string | null>(null)
  useEffect(() => {
    const line = evaluation?.overallFeedback?.trim()
    if (!line) return
    if (spokenForRef.current === line) return
    spokenForRef.current = line

    // Delay so the results card has visibly rendered before the voice starts.
    const id = window.setTimeout(() => speakText(line), 600)
    return () => {
      window.clearTimeout(id)
      stopSpeaking()
    }
  }, [evaluation?.overallFeedback])

  return (
    <div className="flex flex-col items-center w-full h-full" style={{ padding: '48px 24px', overflowY: 'auto' }}>
      {/* Completion heading */}
      <div 
        className="flex items-center justify-center mb-8 shrink-0"
        style={{ 
          width: 96, height: 96, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(232, 185, 108, 0.1)', 
          boxShadow: '0 0 40px rgba(232, 185, 108, 0.2), inset 0 2px 10px rgba(255,255,255,0.1)',
          border: '1px solid rgba(232, 185, 108, 0.3)'
        }}
      >
        <Award size={48} color="#E8B96C" />
      </div>
      <h2 className="font-display font-bold" style={{ 
        fontSize: 56, 
        color: 'transparent', 
        backgroundImage: 'linear-gradient(to bottom right, #FFFFFF, #E8B96C)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        margin: '0 0 12px', textAlign: 'center',
        letterSpacing: '-0.02em'
      }}>
        Session Complete
        {studentFirstName && studentFirstName !== 'there' && `, ${studentFirstName}`}!
      </h2>
      <div className="flex items-center gap-3 mb-12" style={{
        background: 'rgba(255,255,255,0.03)', padding: '12px 24px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <Icon size={24} style={{ color: config.iconColor }} />
        <span className="font-body font-medium" style={{ fontSize: 24, color: 'var(--text-primary)' }}>
          {config.label} Practice
        </span>
      </div>

      {/* Auto-end notice — shown when the session ended automatically.
          Points are NOT awarded on auto-end (session marked as abandoned). */}
      {autoEndReason && (
        <div
          style={{
            marginBottom: 24,
            padding: '14px 24px',
            borderRadius: 12,
            background: 'rgba(245,158,11,0.10)',
            border: '1px solid rgba(245,158,11,0.30)',
            fontSize: 18,
            color: '#92400E',
            textAlign: 'center',
            maxWidth: 640,
            lineHeight: 1.5,
          }}
        >
          {autoEndReason === 'idle'
            ? 'Session ended — no activity for 5 minutes. No points were awarded. You can start a new session anytime.'
            : 'Session reached the 20-minute limit. No points were awarded. You can start a new session anytime.'}
        </div>
      )}

      {/* Points earned badge */}
      {showPoints && pointsAwarded! > 0 && (
        <div style={{ marginBottom: 48, width: '100%', maxWidth: 400 }}>
          <PointsEarnedBadge
            pointsAwarded={pointsAwarded!}
            totalPoints={updatedTotalPoints!}
            variant="full"
            theme="dark"
          />
        </div>
      )}

      {/* Zero-points encouragement */}
      {showPoints && pointsAwarded === 0 && (
        <div
          style={{
            marginBottom: 32,
            padding: '16px 24px',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 20,
            color: 'var(--text-secondary)',
            textAlign: 'center',
          }}
        >
          Better luck next time! Keep practising.
        </div>
      )}

      {/* Score summary from evaluation */}
      {evaluation && (
        <div style={{ 
          marginBottom: 32, display: 'flex', gap: 64, alignItems: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 32,
          padding: '32px 64px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)'
        }}>
          <div className="text-center">
            <div className="font-mono font-bold" style={{ fontSize: 72, color: accentColor, textShadow: '0 0 20px rgba(232, 185, 108, 0.3)' }}>
              {evaluation.correctCount}<span style={{ fontSize: 48, color: 'var(--text-muted)' }}>/5</span>
            </div>
            <div className="font-body" style={{ fontSize: 18, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
              Correct
            </div>
          </div>
          <div style={{ width: 1, height: 80, background: 'rgba(255,255,255,0.08)' }} />
          <div className="text-center">
            <div className="font-mono font-bold" style={{ fontSize: 72, color: 'var(--text-primary)' }}>
              {formatTime(elapsedSeconds)}
            </div>
            <div className="font-body" style={{ fontSize: 18, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
              Time
            </div>
          </div>
        </div>
      )}

      {/* Stats (fallback when no evaluation) */}
      {!evaluation && (
        <div style={{ 
          marginBottom: 32, display: 'flex', gap: 64, alignItems: 'center',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 32,
          padding: '32px 64px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)'
        }}>
          <div className="text-center">
            <div className="font-mono font-bold" style={{ fontSize: 72, color: 'var(--text-primary)' }}>
              {exchangeCount}
            </div>
            <div className="font-body" style={{ fontSize: 18, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
              Questions
            </div>
          </div>
          <div style={{ width: 1, height: 80, background: 'rgba(255,255,255,0.08)' }} />
          <div className="text-center">
            <div className="font-mono font-bold" style={{ fontSize: 72, color: 'var(--text-primary)' }}>
              {formatTime(elapsedSeconds)}
            </div>
            <div className="font-body" style={{ fontSize: 18, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
              Time Spent
            </div>
          </div>
        </div>
      )}

      {/* Overall AI feedback card */}
      {evaluation?.overallFeedback && (
        <div
          style={{
            background: 'rgba(232, 185, 108, 0.03)',
            border: '1px solid rgba(232, 185, 108, 0.15)',
            borderRadius: 32,
            padding: '32px 48px',
            maxWidth: 800,
            width: '100%',
            marginBottom: 48,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(232, 185, 108, 0.05)'
          }}
        >
          <span className="font-mono font-bold" style={{ fontSize: 20, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Overall Feedback
          </span>
          <p className="font-body" style={{ fontSize: 28, color: 'var(--text-primary)', margin: '16px 0 0', lineHeight: 1.6, opacity: 0.9 }}>
            {evaluation.overallFeedback}
          </p>
        </div>
      )}

      {/* Vocab suggestions */}
      {evaluation?.vocabSuggestions && evaluation.vocabSuggestions.length > 0 && (
        <div style={{ maxWidth: 800, width: '100%', marginBottom: 48 }}>
          <span className="font-mono font-bold" style={{ fontSize: 20, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Vocabulary to Review
          </span>
          <div className="flex flex-wrap gap-4 mt-6">
            {evaluation.vocabSuggestions.map((word, i) => (
              <span
                key={i}
                className="font-mono"
                style={{
                  fontSize: 24,
                  padding: '12px 28px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 100,
                  color: 'var(--text-primary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Per-question breakdown */}
      {evaluation?.perQuestion && evaluation.perQuestion.length > 0 && (
        <div style={{ maxWidth: 800, width: '100%', marginBottom: 64 }}>
          <span className="font-mono font-bold" style={{ fontSize: 20, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 24 }}>
            Question Breakdown
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {evaluation.perQuestion.map((result, i) => {
              const questionText = questionTexts?.[result.questionId] || `Question ${i + 1}`
              const studentAnswer = studentAnswers?.[result.questionId] || ''
              
              const isCorrect = result.isCorrect
              const cardBg = isCorrect ? 'rgba(52, 211, 153, 0.04)' : 'rgba(248, 113, 113, 0.04)'
              const cardBorder = isCorrect ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)'
              const iconColor = isCorrect ? '#34D399' : '#F87171'

              return (
                <div
                  key={result.questionId}
                  style={{
                    borderRadius: 24,
                    border: `1px solid ${cardBorder}`,
                    background: cardBg,
                    padding: '32px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  }}
                >
                  <div className="flex items-start gap-6">
                    <span style={{ flexShrink: 0, marginTop: 4 }}>
                      {isCorrect ? <CheckCircle size={36} color={iconColor} strokeWidth={2.5} /> : <XCircle size={36} color={iconColor} strokeWidth={2.5} />}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="font-display font-medium" style={{ fontSize: 28, color: 'var(--text-primary)', margin: '0 0 12px', lineHeight: 1.4 }}>
                        Q{i + 1}. {questionText}
                      </p>
                      {studentAnswer && (
                        <p className="font-body" style={{ fontSize: 24, color: 'var(--text-muted)', margin: '0 0 16px', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '12px 20px', borderRadius: 12 }}>
                          Your answer: &ldquo;{studentAnswer}&rdquo;
                        </p>
                      )}
                      <p className="font-body" style={{ fontSize: 24, color: iconColor, margin: 0, lineHeight: 1.5 }}>
                        {result.feedback}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Last feedback fallback (when no evaluation) */}
      {!evaluation && lastFeedback && (
        <div
          style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
            borderRadius: 24, padding: '24px 32px',
            maxWidth: 600, width: '100%', marginBottom: 48,
          }}
        >
          <span className="font-mono" style={{ fontSize: 16, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Last feedback</span>
          <p className="font-mono font-medium" style={{ fontSize: 28, color: 'var(--text-secondary)', margin: '8px 0 0', lineHeight: 1.5, opacity: 0.8 }}>
            {lastFeedback}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-6" style={{ width: '100%', maxWidth: 800, paddingBottom: 64 }}>
        <button 
          onClick={onPractiseAgain} 
          className="flex-1 flex items-center justify-center gap-3 font-display font-bold cursor-pointer transition-transform active:scale-[0.98]"
          style={{ 
            height: 80, fontSize: 28, borderRadius: 24, border: 'none',
            background: '#E8B96C', color: '#120A08',
            boxShadow: '0 8px 32px rgba(232,185,108,0.25), inset 0 2px 0 rgba(255,255,255,0.2)'
          }}
        >
          <RotateCcw size={28} />
          Practice Again
        </button>
        <button 
          onClick={onBackToMenu} 
          className="flex-1 flex items-center justify-center gap-3 font-display font-bold cursor-pointer transition-transform active:scale-[0.98]"
          style={{ 
            height: 80, fontSize: 28, borderRadius: 24, 
            background: 'rgba(255,255,255,0.05)', color: 'white',
            border: '2px solid rgba(255,255,255,0.1)',
          }}
        >
          <Home size={28} />
          Home Menu
        </button>
      </div>
    </div>
  )
}

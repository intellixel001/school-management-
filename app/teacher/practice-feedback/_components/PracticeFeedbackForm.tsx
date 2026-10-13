'use client'

import { useState, useCallback, useRef } from 'react'
import { INPUT_LIMITS } from '@/lib/security/inputLimits'
import { Toast } from '@/app/teacher/review/_components/Toast'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  initialValue: string
  onSave: (feedback: string) => Promise<void>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasEnoughContent(text: string): boolean {
  return text.replace(/\s/g, '').length >= 5
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PracticeFeedbackForm({ initialValue, onSave }: Props) {
  const [feedback, setFeedback] = useState(initialValue)
  const [isSaving, setIsSaving] = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)

  const dismissToast = useCallback(() => setShowToast(false), [])

  const canSave    = hasEnoughContent(feedback) && !isSaving
  const charCount  = feedback.length
  const nearLimit  = charCount > INPUT_LIMITS.TEACHER_FEEDBACK * 0.85
  const atLimit    = charCount >= INPUT_LIMITS.TEACHER_FEEDBACK

  async function handleSave() {
    if (!canSave) return
    setIsSaving(true)
    setError(null)
    try {
      setShowToast(true)
      await onSave(feedback)
    } catch (err) {
      setShowToast(false)
      setError(err instanceof Error ? err.message : 'Failed to save feedback. Please try again.')
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* ── Feedback card — matches card chrome from review detail pages ─────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid rgba(15,23,42,0.08)',
        borderRadius: 14,
        padding: '22px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        {/* Section heading */}
        <h3 style={{
          margin: '0 0 4px',
          fontSize: 15, fontWeight: 700, color: '#111827',
        }}>
          Feedback for this student
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
          Write personalised notes — what they did well, what to focus on next time.
          This will be visible to them on their Results page.
        </p>

        {/* Textarea — styling verbatim from WritingReviewDetail teacher-feedback block */}
        <textarea
          id="practice-feedback-textarea"
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          maxLength={INPUT_LIMITS.TEACHER_FEEDBACK}
          placeholder="Write your feedback here… (e.g. 'Good fluency. Focus on complex sentence structures next time.')"
          rows={6}
          style={{
            width: '100%',
            padding: 16,
            fontSize: 15,
            lineHeight: 1.6,
            border: '1px solid rgba(15, 23, 42, 0.1)',
            borderRadius: 8,
            resize: 'vertical',
            fontFamily: 'inherit',
            color: '#111827',
            background: '#FAFAFA',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Character counter — same position/style as WritingReviewDetail */}
        <div style={{
          fontSize: 12, marginTop: 4, textAlign: 'right',
          color: atLimit ? '#EF4444' : nearLimit ? '#F59E0B' : '#6B7280',
          fontWeight: nearLimit ? 600 : 400,
        }}>
          {charCount} / {INPUT_LIMITS.TEACHER_FEEDBACK}
        </div>

        {/* Error message */}
        {error && (
          <div style={{ marginTop: 10, fontSize: 13, color: '#DC2626', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* Save button — styling matches the publish button from review detail pages */}
        <div style={{ marginTop: 18 }}>
          <button
            id="save-practice-feedback"
            onClick={handleSave}
            disabled={!canSave}
            style={{
              padding: '12px 28px',
              background: canSave
                ? 'linear-gradient(135deg, #4D9FFF 0%, #0066CC 100%)'
                : '#E2E8F0',
              color: canSave ? '#FFFFFF' : '#94A3B8',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              border: 'none',
              cursor: canSave ? 'pointer' : 'default',
              opacity: isSaving ? 0.75 : 1,
              transition: 'opacity 150ms ease, background 150ms ease',
              boxShadow: canSave ? '0 4px 14px rgba(0,102,204,0.28)' : 'none',
            }}
          >
            {isSaving ? 'Saving…' : 'Save feedback'}
          </button>

          {!canSave && !isSaving && (
            <span style={{ marginLeft: 12, fontSize: 12, color: '#94A3B8' }}>
              Write at least 5 characters to enable
            </span>
          )}
        </div>
      </div>

      {/* ── Toast — reuse the existing Toast primitive ──────────────────────── */}
      <Toast
        message="Feedback saved! Returning to queue…"
        show={showToast}
        onDismiss={dismissToast}
      />
    </>
  )
}

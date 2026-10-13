'use client'

import { useState, useEffect } from 'react'
import { requestRegistrationOTP, verifyRegistrationOTP } from '@/lib/services'
import { INPUT_LIMITS } from '@/lib/security/inputLimits'

interface OTPStepProps {
  email: string
  onVerified: () => void
  onBack: () => void
}

function Spinner() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'reg-spin 0.75s linear infinite', flexShrink: 0 }}
    >
      <style>{`@keyframes reg-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

export default function OTPStep({ email, onVerified, onBack }: OTPStepProps) {
  const [code,            setCode]            = useState('')
  const [error,           setError]           = useState('')
  const [resendNotice,    setResendNotice]    = useState('')
  const [isSubmitting,    setIsSubmitting]    = useState(false)
  const [isResending,     setIsResending]     = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(60)

  // 60-second countdown timer for resending OTP
  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownSeconds])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting) return
    setError('')

    if (code.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setIsSubmitting(true)
    try {
      await verifyRegistrationOTP(email, code)
      onVerified()
    } catch (err) {
      const msg = (err as { message?: string })?.message
      setError(msg || "That code didn't work. Please check and try again.")
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
    if (cooldownSeconds > 0 || isResending) return
    setError('')
    setIsResending(true)
    setCooldownSeconds(60)
    try {
      await requestRegistrationOTP(email)
      // Resend re-sends the SAME code — it is the student's permanent PIN, so
      // the backend must not rotate it on resend (see backend handoff §5).
      setResendNotice('Code re-sent — check your email')
      setTimeout(() => setResendNotice(''), 4000)
    } catch (err) {
      const msg = (err as { message?: string })?.message
      setError(msg || 'Could not resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const canSubmit = code.length === 6 && !isSubmitting

  return (
    <>
      <h2 style={{
        fontFamily: 'var(--font-display, sans-serif)',
        fontSize: 28, fontWeight: 700, color: '#1A1A1A', margin: 0, lineHeight: 1.2,
      }}>
        Check your email
      </h2>
      <p style={{
        fontFamily: 'var(--font-body, sans-serif)',
        fontSize: 14, color: '#666666', marginTop: 8, marginBottom: 0, lineHeight: 1.6,
      }}>
        We sent a 6-digit code to{' '}
        <strong style={{ color: '#1A1A1A' }}>{email}</strong>. Enter it below to verify your email.
      </p>
      <div style={{
        display: 'flex', gap: 10, alignItems: 'flex-start',
        marginTop: 16, padding: '12px 14px', borderRadius: 10,
        background: '#EEF2FF', border: '1px solid #C7D2FE',
      }}>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: 1 }}
          aria-hidden
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p style={{
          margin: 0,
          fontFamily: 'var(--font-body, sans-serif)',
          fontSize: 13, lineHeight: 1.5, color: '#3730A3',
        }}>
          We&apos;ll send a pin in your email. Use it to log in your student portal and in the kiosk.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}
        noValidate
      >
        {/* OTP input — single field with letter spacing */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)', fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: '#555555', fontWeight: 700,
          }}>
            Verification Code
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={INPUT_LIMITS.OTP}
            placeholder="000000"
            value={code}
            autoFocus
            autoComplete="one-time-code"
            required
            onChange={(e) => {
              // Strip non-digits, cap at 6
              setCode(e.target.value.replace(/\D/g, '').slice(0, INPUT_LIMITS.OTP))
              if (error) setError('')
            }}
            style={{
              padding: '16px',
              borderRadius: 10,
              border: '2px solid #E5E5E5',
              outline: 'none',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '0.5em',
              color: '#1A1A1A',
              background: '#FAFAFA',
              textAlign: 'center',
              transition: 'border-color 150ms ease, background 150ms ease',
              width: '100%',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#4F46E5'
              e.currentTarget.style.background = '#FFFFFF'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E5E5E5'
              e.currentTarget.style.background = '#FAFAFA'
            }}
          />
        </label>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: '#FEE2E2', border: '1px solid #FCA5A5',
            color: '#991B1B', fontSize: 14, fontWeight: 500,
            fontFamily: 'var(--font-body, sans-serif)',
          }}>
            {error}
          </div>
        )}

        {/* Resend notice */}
        {resendNotice && !error && (
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: '#ECFDF5', border: '1px solid #6EE7B7',
            color: '#065F46', fontSize: 14, fontWeight: 500,
            fontFamily: 'var(--font-body, sans-serif)',
          }}>
            {resendNotice}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            marginTop: 8, height: 52, borderRadius: 10, border: 'none',
            background: !canSubmit ? '#A5A5A5' : '#4F46E5',
            color: '#FFFFFF',
            fontFamily: 'var(--font-display, sans-serif)',
            fontSize: 16, fontWeight: 700,
            cursor: !canSubmit ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 150ms ease, transform 80ms ease',
            width: '100%',
          }}
          onMouseEnter={(e) => { if (canSubmit) e.currentTarget.style.background = '#4338CA' }}
          onMouseLeave={(e) => { if (canSubmit) e.currentTarget.style.background = '#4F46E5' }}
          onMouseDown={(e) => { if (canSubmit) e.currentTarget.style.transform = 'scale(0.98)' }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {isSubmitting ? <><Spinner /> Verifying…</> : 'Verify code'}
        </button>
      </form>

      {/* Resend + back links */}
      <p style={{
        fontFamily: 'var(--font-body, sans-serif)',
        fontSize: 12, color: '#888888', marginTop: 16, marginBottom: 0,
      }}>
        Didn&apos;t get the code?{' '}
        <button
          type="button"
          disabled={cooldownSeconds > 0}
          onClick={handleResend}
          style={{
            background: 'none', border: 'none', padding: 0,
            color: cooldownSeconds > 0 ? '#888888' : '#4F46E5',
            fontWeight: 600, fontSize: 12,
            cursor: cooldownSeconds > 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body, sans-serif)',
            textDecoration: cooldownSeconds > 0 ? 'none' : 'underline',
            textUnderlineOffset: 2,
          }}
        >
          {cooldownSeconds > 0 ? `Resend code (${cooldownSeconds}s)` : 'Resend code'}
        </button>
      </p>

      <p style={{
        fontFamily: 'var(--font-body, sans-serif)',
        fontSize: 12, color: '#888888', marginTop: 8, marginBottom: 0,
      }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: 'none', border: 'none', padding: 0,
            color: '#4F46E5', fontWeight: 600, fontSize: 12,
            cursor: 'pointer', fontFamily: 'var(--font-body, sans-serif)',
            textDecoration: 'underline', textUnderlineOffset: 2,
          }}
        >
          ← Use a different email
        </button>
      </p>
    </>
  )
}

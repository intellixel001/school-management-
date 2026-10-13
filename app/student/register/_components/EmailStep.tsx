'use client'

import { useState } from 'react'
import { requestRegistrationOTP } from '@/lib/services'
import { INPUT_LIMITS, sanitizeIdentityField, isValidEmail } from '@/lib/security/inputLimits'

interface EmailStepProps {
  initialEmail?: string
  onSubmit: (email: string, name: string) => void
}

// ── Inline spinner ────────────────────────────────────────────────────────────
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

// ── Shared input style ─────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 10,
  border: '2px solid #E5E5E5',
  outline: 'none',
  fontFamily: 'var(--font-body, sans-serif)',
  fontSize: 15,
  color: '#1A1A1A',
  background: '#FAFAFA',
  transition: 'border-color 150ms ease, background 150ms ease',
  width: '100%',
  boxSizing: 'border-box',
}

function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#4F46E5'
  e.currentTarget.style.background = '#FFFFFF'
}
function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#E5E5E5'
  e.currentTarget.style.background = '#FAFAFA'
}
function handleMouseEnter(e: React.MouseEvent<HTMLInputElement>) {
  if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#999'
}
function handleMouseLeave(e: React.MouseEvent<HTMLInputElement>) {
  if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#E5E5E5'
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EmailStep({ initialEmail = '', onSubmit }: EmailStepProps) {
  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState(initialEmail)
  const [error,       setError]       = useState('')
  const [emailTaken,  setEmailTaken]  = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setEmailTaken(false)

    const trimmedName  = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedName) {
      setError('Please enter your full name')
      return
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    try {
      await requestRegistrationOTP(trimmedEmail)
      onSubmit(trimmedEmail, trimmedName)
    } catch (err) {
      const code = (err as { code?: string })?.code
      if (code === 'EMAIL_TAKEN') {
        setError('This email is already registered.')
        setEmailTaken(true)
      } else if (code === 'INVALID_EMAIL') {
        setError('Please enter a valid email address')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && !isSubmitting

  return (
    <>
      <h2 style={{
        fontFamily: 'var(--font-display, sans-serif)',
        fontSize: 28, fontWeight: 700, color: '#1A1A1A', margin: 0, lineHeight: 1.2,
      }}>
        Create your account
      </h2>
      <p style={{
        fontFamily: 'var(--font-body, sans-serif)',
        fontSize: 14, color: '#666666', marginTop: 8, marginBottom: 0,
      }}>
        Start practising English with AI tutors at Nelson College.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}
        noValidate
      >
        {/* Full Name */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)', fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: '#555555', fontWeight: 700,
          }}>
            Full Name
          </span>
          <input
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            value={name}
            autoFocus
            required
            maxLength={INPUT_LIMITS.NAME}
            onChange={(e) => { setName(sanitizeIdentityField(e.target.value, INPUT_LIMITS.NAME)); if (error) setError('') }}
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        </label>

        {/* Email */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)', fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: '#555555', fontWeight: 700,
          }}>
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            required
            maxLength={INPUT_LIMITS.EMAIL}
            onChange={(e) => { setEmail(sanitizeIdentityField(e.target.value, INPUT_LIMITS.EMAIL)); if (error) setError('') }}
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          />
        </label>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: '#FEE2E2', border: '1px solid #FCA5A5',
            color: '#991B1B', fontSize: 14, fontWeight: 500,
            fontFamily: 'var(--font-body, sans-serif)',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <span>{error}</span>
            {emailTaken && (
              <a
                href="/student/login"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '8px 14px', borderRadius: 8,
                  background: '#DC2626', color: '#FFFFFF',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  alignSelf: 'flex-start',
                  fontFamily: 'var(--font-display, sans-serif)',
                }}
              >
                Sign in instead →
              </a>
            )}
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
          {isSubmitting ? <><Spinner /> Sending code…</> : 'Send verification code'}
        </button>
      </form>

      {/* Verification hint */}
      <p style={{
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 10, color: '#AAAAAA', marginTop: 16, letterSpacing: '0.08em',
        textTransform: 'uppercase', marginBottom: 0,
      }}>
        We'll send a 6-digit code to verify your email
      </p>

      {/* Already have account */}
      <p style={{
        fontFamily: 'var(--font-body, sans-serif)',
        fontSize: 12, color: '#888888', marginTop: 12, marginBottom: 0,
      }}>
        Already have an account?{' '}
        <a
          href="/student/login"
          style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}
        >
          Sign in
        </a>
      </p>
    </>
  )
}

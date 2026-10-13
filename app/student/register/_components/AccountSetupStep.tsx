'use client'

import { useState, useCallback } from 'react'
import { completeRegistration, requestRegistrationOTP } from '@/lib/services'
import { INPUT_LIMITS, sanitizeIdentityField } from '@/lib/security/inputLimits'
import Turnstile, { isTurnstileConfigured } from '@/components/security/Turnstile'

interface AccountSetupStepProps {
  initialEmail?: string
  onSubmit: (email: string, name: string) => void
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

export default function AccountSetupStep({ initialEmail = '', onSubmit }: AccountSetupStepProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')

  // Only gate submission on Turnstile when a site key is actually configured,
  // so an unconfigured local dev environment isn't hard-blocked. The backend
  // verifies the token regardless, so this cannot be used to bypass the check.
  const turnstileRequired = isTurnstileConfigured()

  const handleTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), [])
  const handleTurnstileClear  = useCallback(() => setTurnstileToken(''), [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isSubmitting) return
    setError('')

    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()

    if (!trimmedName) {
      setError('Please enter your full name')
      return
    }
    if (turnstileRequired && !turnstileToken) {
      setError('Please complete the verification below.')
      return
    }

    setIsSubmitting(true)
    try {
      // Step 1: Create the account (critical — must succeed).
      // No PIN is sent: the backend generates a unique one and emails it.
      await completeRegistration(trimmedEmail, trimmedName, turnstileToken || undefined)
    } catch (err) {
      const code = (err as { code?: string })?.code
      const message = (err as { message?: string })?.message || ''
      if (code === 'EMAIL_TAKEN' || message.toLowerCase().includes('already exists')) {
        setError('This email is already registered. Please sign in instead.')
      } else if (code === 'TURNSTILE_FAILED') {
        setError('Verification failed. Please try again.')
        setTurnstileToken('')
      } else {
        setError(message || 'Something went wrong. Please try again.')
      }
      setIsSubmitting(false)
      return
    }

    // Step 2: Fire OTP email (best-effort — transition regardless of outcome)
    requestRegistrationOTP(trimmedEmail).catch(() => {
      // OTP send failed — the OTP step will show a resend button so user can retry
    })
    onSubmit(trimmedEmail, trimmedName)
  }

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    (!turnstileRequired || turnstileToken.length > 0) &&
    !isSubmitting

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
        Enter your details to create an account.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}
        noValidate
      >
        {/* Full Name */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
            placeholder="e.g. Ravi Patel"
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
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{
            fontFamily: 'var(--font-mono, monospace)', fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: '#555555', fontWeight: 700,
          }}>
            Email Address
          </span>
          <input
            type="email"
            autoComplete="email"
            placeholder="your.email@example.com"
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

        {/* PIN notice — students no longer choose a PIN. The backend generates
            a unique 6-digit PIN and emails it once the account is approved. */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          padding: '12px 14px', borderRadius: 10,
          background: '#EEF2FF', border: '1px solid #C7D2FE',
        }}>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: 1 }}
            aria-hidden
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-10 6L2 7" />
          </svg>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-body, sans-serif)',
            fontSize: 13, lineHeight: 1.5, color: '#3730A3',
          }}>
            <strong style={{ fontWeight: 700 }}>We&apos;ll send a PIN in your email.</strong>{' '}
            Use it to log in your student portal and in the kiosk.
          </p>
        </div>

        {/* Bot protection — only renders when a Turnstile site key is set */}
        <Turnstile
          onVerify={handleTurnstileVerify}
          onExpire={handleTurnstileClear}
          onError={handleTurnstileClear}
        />

        {/* Error */}
        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: '#FEE2E2', border: '1px solid #FCA5A5',
            color: '#991B1B', fontSize: 13, fontWeight: 500,
            fontFamily: 'var(--font-body, sans-serif)',
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            marginTop: 4, height: 50, borderRadius: 10, border: 'none',
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
          {isSubmitting ? <><Spinner /> Creating account…</> : 'Create account & verify →'}
        </button>
      </form>

      {/* Already have account */}
      <p style={{
        fontFamily: 'var(--font-body, sans-serif)',
        fontSize: 12, color: '#888888', marginTop: 14, marginBottom: 0,
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

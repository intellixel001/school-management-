'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authenticateStudent } from '@/lib/services'
import { useStudentSession } from '../_components/StudentSessionProvider'
import { INPUT_LIMITS, sanitizeIdentityField } from '@/lib/security/inputLimits'

// ── Inline spinner — no external dependency ───────────────────────────────────
function Spinner() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: 'login-spin 0.75s linear infinite', flexShrink: 0 }}
    >
      <style>{`
        @keyframes login-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

export default function StudentLoginPage() {
  const router = useRouter()
  const { setSession } = useStudentSession()

  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setErrorCode('')

    const trimmedEmail = email.trim().toLowerCase()

    // 1. PIN length check
    if (pin.length !== 6) {
      setError('Please enter your 6-digit PIN')
      return
    }

    // 3. Auth via service
    setIsSubmitting(true)
    try {
      const student = await authenticateStudent(trimmedEmail, pin)
      setSession({
        studentId: student.id,
        email: student.email,
        loggedInAt: Date.now(),
      })
      setIsSubmitting(false)
      router.replace('/student')
    } catch (err) {
      setIsSubmitting(false)
      const code = (err as { code?: string })?.code || ''
      setErrorCode(code)
      if (code === 'INVALID_DOMAIN') {
        setError('Please use your valid college email')
      } else if (code === 'ACCOUNT_PENDING') {
        setError('Your account is being reviewed by your teacher. Once your account is approved, you\'ll be able to log in to your dashboard.')
      } else if (code === 'EMAIL_UNVERIFIED') {
        setError('Email verification (OTP) is required before login.')
      } else if (code === 'NOT_FOUND' || code === 'INVALID_PIN' || code === 'BAD_REQUEST') {
        setError('Invalid email or PIN. Please try again.')
      } else if (code === 'NETWORK_ERROR') {
        setError('Cannot reach the server. Please check your connection and try again.')
      } else {
        setError('Something went wrong. Please try again.')
      }
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        background: '#F5F5F2',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          maxWidth: 1080,
          width: '100%',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08)',
          background: '#FFFFFF',
        }}
        className="login-grid"
      >
        {/* ── Left panel — branding ─────────────────────────────────────────── */}
        <div
          className="login-left-panel"
          style={{
            display: 'none', // shown via media query below
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 48,
            minHeight: 560,
            background: 'linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #0891B2 100%)',
            color: '#FFFFFF',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                opacity: 0.7,
                marginBottom: 8,
              }}
            >
              Nelson College London
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display, sans-serif)',
                fontSize: 32,
                fontWeight: 700,
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              English AI Tutor
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-body, sans-serif)',
                fontSize: 16,
                opacity: 0.8,
                marginTop: 12,
                maxWidth: 280,
                lineHeight: 1.6,
              }}
            >
              Practise English with AI tutors tailored to your level.
            </p>

            {/* Decorative orbs */}
            <div style={{ marginTop: 48, position: 'relative', height: 180 }}>
              <div style={{
                position: 'absolute', width: 120, height: 120, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                top: 0, left: 0,
              }} />
              <div style={{
                position: 'absolute', width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                top: 40, left: 80,
              }} />
              <div style={{
                position: 'absolute', width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(255,255,255,0.10)',
                top: 20, left: 160,
              }} />
              {/* Stat cards */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0,
                display: 'flex', gap: 12,
              }}>
                {[
                  // Facts, not fabricated marketing numbers. NCL runs a 4-level
                  // Pre-sessional programme covering 4 skills, backed by AI.
                  { value: '4', label: 'Levels' },
                  { value: '4', label: 'Skills' },
                  { value: 'AI', label: 'Powered' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 12,
                    padding: '10px 16px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.18)',
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              opacity: 0.6,
            }}
          >
            Student Portal
          </div>
        </div>

        {/* ── Right panel — form ───────────────────────────────────────────── */}
        <div
          style={{
            padding: 48,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 560,
          }}
        >
          {/* Mobile brand mark — shown only when left panel is hidden */}
          <div className="login-mobile-brand" style={{ marginBottom: 32 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #4F46E5 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
              marginBottom: 16,
            }}>
              EC
            </div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888', marginBottom: 4 }}>
              Nelson College London
            </div>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-display, sans-serif)',
              fontSize: 28,
              fontWeight: 700,
              color: '#1A1A1A',
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Sign in to your dashboard
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body, sans-serif)',
              fontSize: 14,
              color: '#666666',
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            Use the email and PIN your college provided.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}
            noValidate
          >
            {/* Email */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#555555',
                  fontWeight: 700,
                }}
              >
                Email
              </span>
              <input
                type="email"
                autoComplete="username"
                placeholder="your.email@example.com"
                value={email}
                autoFocus
                required
                maxLength={INPUT_LIMITS.EMAIL}
                onChange={(e) => { setEmail(sanitizeIdentityField(e.target.value, INPUT_LIMITS.EMAIL)); if (error) setError('') }}
                style={{
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
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#4F46E5'
                  e.currentTarget.style.background = '#FFFFFF'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#E5E5E5'
                  e.currentTarget.style.background = '#FAFAFA'
                }}
                onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#999' }}
                onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#E5E5E5' }}
              />
            </label>

            {/* PIN */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: '#555555',
                  fontWeight: 700,
                }}
              >
                PIN (6 digits)
              </span>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="••••••"
                value={pin}
                required
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, INPUT_LIMITS.PIN)); if (error) setError('') }}
                style={{
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '2px solid #E5E5E5',
                  outline: 'none',
                  fontFamily: 'var(--font-body, sans-serif)',
                  fontSize: 15,
                  color: '#1A1A1A',
                  background: '#FAFAFA',
                  letterSpacing: '0.4em',
                  transition: 'border-color 150ms ease, background 150ms ease',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#4F46E5'
                  e.currentTarget.style.background = '#FFFFFF'
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = '#E5E5E5'
                  e.currentTarget.style.background = '#FAFAFA'
                }}
                onMouseEnter={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#999' }}
                onMouseLeave={e => { if (document.activeElement !== e.currentTarget) e.currentTarget.style.borderColor = '#E5E5E5' }}
              />
            </label>

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 10,
                  background: '#FEE2E2',
                  border: '1px solid #FCA5A5',
                  color: '#991B1B',
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: 'var(--font-body, sans-serif)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div>{error}</div>
                {errorCode === 'EMAIL_UNVERIFIED' && (
                  <div>
                    <a
                      href={`/student/register?email=${encodeURIComponent(email)}&step=otp`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 16px',
                        borderRadius: 8,
                        background: '#4F46E5',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: 13,
                        textDecoration: 'none',
                        transition: 'background 150ms ease',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#4338CA' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#4F46E5' }}
                    >
                      Verify Email &amp; Request OTP →
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || !email || !pin}
              style={{
                marginTop: 8,
                height: 52,
                borderRadius: 10,
                border: 'none',
                background: isSubmitting || !email || !pin ? '#A5A5A5' : '#4F46E5',
                color: '#FFFFFF',
                fontFamily: 'var(--font-display, sans-serif)',
                fontSize: 16,
                fontWeight: 700,
                cursor: isSubmitting || !email || !pin ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 150ms ease, transform 80ms ease',
                width: '100%',
              }}
              onMouseEnter={e => {
                if (!isSubmitting && email && pin) e.currentTarget.style.background = '#4338CA'
              }}
              onMouseLeave={e => {
                if (!isSubmitting && email && pin) e.currentTarget.style.background = '#4F46E5'
              }}
              onMouseDown={e => {
                if (!isSubmitting && email && pin) e.currentTarget.style.transform = 'scale(0.98)'
              }}
              onMouseUp={e => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p
            style={{
              fontFamily: 'var(--font-body, sans-serif)',
              fontSize: 12,
              color: '#888888',
              marginTop: 24,
              marginBottom: 0,
            }}
          >
            Need help?{' '}
            <span style={{ color: '#4F46E5', fontWeight: 600 }}>
              Contact your teacher.
            </span>
          </p>
          <p
            style={{
              fontFamily: 'var(--font-body, sans-serif)',
              fontSize: 12,
              color: '#888888',
              marginTop: 12,
              marginBottom: 0,
            }}
          >
            New student?{' '}
            <Link
              href="/student/register"
              style={{ color: '#4F46E5', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 2 }}
            >
              Register here
            </Link>
          </p>
        </div>
      </div>

      {/* ── Responsive styles ──────────────────────────────────────────────── */}
      <style>{`
        @media (min-width: 768px) {
          .login-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .login-left-panel {
            display: flex !important;
          }
          .login-mobile-brand {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

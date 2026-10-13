'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authenticateTeacher } from '@/lib/services'
import { useTeacherSession } from '../_components/TeacherSessionProvider'
import { INPUT_LIMITS, sanitizeIdentityField } from '@/lib/security/inputLimits'

// RFC 5322 simplified — covers all realistic email shapes, rejects junk.
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const PASSWORD_MIN_LENGTH = 6

export default function TeacherLoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { setSession } = useTeacherSession()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const returnTo = params.get('return') || '/teacher'

  // Sanitize at input time — strips control chars + < > from pasted garbage
  // BEFORE it sits in state. Defense against accidental script injection
  // attempts and pasted clipboard junk.
  function handleEmailChange(raw: string) {
    setEmail(sanitizeIdentityField(raw, INPUT_LIMITS.EMAIL))
  }

  // Password isn't sanitized (could legitimately contain symbols) but length
  // is clamped natively via maxLength.
  function handlePasswordChange(raw: string) {
    setPassword(raw.slice(0, INPUT_LIMITS.PASSWORD))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const cleanEmail = email.toLowerCase().trim()

      // Format validation — proper email shape, no whitespace anywhere
      if (!EMAIL_REGEX.test(cleanEmail)) {
        throw new Error('Enter a valid email address')
      }
      if (/\s/.test(cleanEmail)) {
        throw new Error('Email cannot contain spaces')
      }

      // Password presence + minimum length
      if (password.length === 0) {
        throw new Error('Enter your password')
      }
      if (password.length < PASSWORD_MIN_LENGTH) {
        throw new Error(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      }

      const teacher = await authenticateTeacher(cleanEmail, password)
      setSession({
        teacherId: teacher.id,
        name: teacher.name,
        email: teacher.email,
      })
      window.location.href = returnTo

    } catch (err) {
      // Client-side format errors pass through verbatim.
      const knownClientError =
        err instanceof Error && (
          err.message.startsWith('Enter') ||
          err.message.startsWith('Email cannot') ||
          err.message.startsWith('Password must')
        )
      if (knownClientError) {
        setError((err as Error).message)
      } else {
        // Show network errors distinctly so users can retry after a cold start,
        // but keep credential errors generic (account-enumeration protection).
        const code = (err as { code?: string })?.code
        if (code === 'NETWORK_ERROR') {
          setError('Cannot reach the server. Please check your connection and try again.')
        } else {
          setError('Invalid email or password')
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #0A1628 0%, #1E293B 100%)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: 20,
        padding: '36px 32px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.40)',
      }}>
        <h1 style={{
          fontSize: 26, fontWeight: 700, color: '#F1F5F9',
          margin: '0 0 6px', fontFamily: 'var(--font-display)',
        }}>
          Teacher Portal
        </h1>
        <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 28px' }}>
          Sign in to manage students, review submissions, and publish scores.
        </p>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1', letterSpacing: '0.4px' }}>
              EMAIL
            </span>
            <input
              type="email"
              value={email}
              onChange={e => handleEmailChange(e.target.value)}
              maxLength={INPUT_LIMITS.EMAIL}
              required
              autoComplete="username"
              spellCheck={false}
              autoCapitalize="off"
              inputMode="email"
              style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#F1F5F9', fontSize: 15,
                outline: 'none',
              }}
            />
          </label>

          {/* Password */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1', letterSpacing: '0.4px' }}>
              PASSWORD
            </span>
            <input
              type="password"
              value={password}
              onChange={e => handlePasswordChange(e.target.value)}
              maxLength={INPUT_LIMITS.PASSWORD}
              minLength={PASSWORD_MIN_LENGTH}
              required
              autoComplete="current-password"
              spellCheck={false}
              style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: '#F1F5F9', fontSize: 15,
                outline: 'none',
              }}
            />
          </label>

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(239,68,68,0.10)', color: '#FCA5A5',
              fontSize: 13, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 8, padding: '12px 16px', borderRadius: 10,
              background: '#4D9FFF', color: '#0A1628',
              fontSize: 15, fontWeight: 700,
              border: 'none', cursor: submitting ? 'wait' : 'pointer',
              opacity: submitting ? 0.7 : 1,
              boxShadow: '0 4px 16px rgba(77,159,255,0.30)',
            }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

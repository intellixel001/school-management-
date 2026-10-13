'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AccountSetupStep from './_components/AccountSetupStep'
import OTPStep          from './_components/OTPStep'
import AwaitingApprovalStep from './_components/AwaitingApprovalStep'

// ── State machine ─────────────────────────────────────────────────────────────
type RegisterStep = 'account' | 'otp' | 'done'

// ── Step indicator ────────────────────────────────────────────────────────────
const STEPS: Array<{ key: RegisterStep; label: string }> = [
  { key: 'account', label: 'Account' },
  { key: 'otp',     label: 'Verify'  },
  { key: 'done',    label: 'Done'    },
]

function StepIndicator({ current }: { current: RegisterStep }) {
  const currentIdx = STEPS.findIndex(s => s.key === current)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32 }}>
      {STEPS.map((step, idx) => {
        const done   = idx < currentIdx
        const active = idx === currentIdx
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: idx < STEPS.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: done ? '#4F46E5' : active ? '#4F46E5' : '#E5E5E5',
                border: active ? '3px solid rgba(79,70,229,0.25)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
                color: done || active ? '#FFFFFF' : '#999999',
                transition: 'background 200ms ease',
                boxSizing: 'border-box',
              }}>
                {done ? '✓' : idx + 1}
              </div>
              <span style={{
                fontSize: 10, fontFamily: 'var(--font-mono, monospace)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                color: active ? '#4F46E5' : done ? '#666666' : '#AAAAAA',
                fontWeight: active ? 700 : 400,
              }}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginBottom: 18, marginLeft: 4, marginRight: 4,
                background: done ? '#4F46E5' : '#E5E5E5',
                transition: 'background 200ms ease',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Register Content ──────────────────────────────────────────────────────────

function RegisterPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const qEmail = searchParams.get('email') || ''
  const qStep = searchParams.get('step')

  // Step state — initialized optionally from URL params
  const [step,  setStep]  = useState<RegisterStep>(qStep === 'otp' ? 'otp' : 'account')
  const [email, setEmail] = useState(qEmail)
  const [name,  setName]  = useState('')

  useEffect(() => {
    if (qEmail) setEmail(qEmail)
    if (qStep === 'otp') setStep('otp')
  }, [qEmail, qStep])

  // ── Step handlers ─────────────────────────────────────────────────────────

  function handleAccountCreated(submittedEmail: string, submittedName: string) {
    setEmail(submittedEmail)
    setName(submittedName)
    setStep('otp')
  }

  function handleOTPVerified() {
    setStep('done')
  }

  function handleBackToLogin() {
    router.push('/student/login?registered=1')
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
        className="reg-grid"
      >
        {/* ── Left panel — brand gradient ─────────────────────────────────────── */}
        <div
          className="reg-left-panel"
          style={{
            display: 'none', // shown via media query
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 48,
            minHeight: 620,
            background: 'linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #0891B2 100%)',
            color: '#FFFFFF',
          }}
        >
          <div>
            <div style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11, textTransform: 'uppercase',
              letterSpacing: '0.2em', opacity: 0.7, marginBottom: 8,
            }}>
              Nelson College London
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display, sans-serif)',
              fontSize: 32, fontWeight: 700, lineHeight: 1.2, margin: 0,
            }}>
              English AI Tutor
            </h1>
            <p style={{
              fontFamily: 'var(--font-body, sans-serif)',
              fontSize: 16, opacity: 0.8, marginTop: 12, maxWidth: 280, lineHeight: 1.6,
            }}>
              Practise English with AI tutors tailored to your level.
            </p>

            {/* Decorative orbs */}
            <div style={{ marginTop: 48, position: 'relative', height: 180 }}>
              <div style={{
                position: 'absolute', width: 120, height: 120, borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)', top: 0, left: 0,
              }} />
              <div style={{
                position: 'absolute', width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)', top: 40, left: 80,
              }} />
              <div style={{
                position: 'absolute', width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(255,255,255,0.10)', top: 20, left: 160,
              }} />
              {/* Stat cards */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, display: 'flex', gap: 12 }}>
                {[
                  { value: '3', label: 'Steps' },
                  { value: '4', label: 'Skills' },
                  { value: 'AI', label: 'Powered' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 12, padding: '10px 16px', textAlign: 'center',
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

          <div style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11, textTransform: 'uppercase',
            letterSpacing: '0.15em', opacity: 0.6,
          }}>
            Student Registration
          </div>
        </div>

        {/* ── Right panel — step content ──────────────────────────────────────── */}
        <div
          style={{
            padding: 48,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: 620,
          }}
        >
          {/* Mobile brand mark */}
          <div className="reg-mobile-brand" style={{ marginBottom: 24 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 50%, #4F46E5 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
              marginBottom: 12,
            }}>
              EC
            </div>
            <div style={{ fontSize: 11, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#888', marginBottom: 4 }}>
              Nelson College London
            </div>
          </div>

          {/* Progress indicator */}
          <StepIndicator current={step} />

          {/* Step content */}
          {step === 'account' && (
            <AccountSetupStep
              initialEmail={email}
              onSubmit={handleAccountCreated}
            />
          )}
          {step === 'otp' && (
            <OTPStep
              email={email}
              onVerified={handleOTPVerified}
              onBack={() => setStep('account')}
            />
          )}
          {step === 'done' && (
            <AwaitingApprovalStep
              email={email}
              onBackToLogin={handleBackToLogin}
            />
          )}
        </div>
      </div>

      {/* ── Responsive styles — mirrors /student/login ────────────────────────── */}
      <style>{`
        @media (min-width: 768px) {
          .reg-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .reg-left-panel {
            display: flex !important;
          }
          .reg-mobile-brand {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageContent />
    </Suspense>
  )
}

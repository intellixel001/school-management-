'use client'

interface AwaitingApprovalStepProps {
  email: string
  onBackToLogin: () => void
}

export default function AwaitingApprovalStep({ email, onBackToLogin }: AwaitingApprovalStepProps) {
  return (
    <>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: '#ECFDF5', border: '2px solid #6EE7B7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display, sans-serif)',
        fontSize: 28, fontWeight: 700, color: '#1A1A1A', margin: 0, lineHeight: 1.2,
      }}>
        Account created
      </h2>
      <p style={{
        fontFamily: 'var(--font-body, sans-serif)',
        fontSize: 14, color: '#666666', marginTop: 8, marginBottom: 0, lineHeight: 1.6,
      }}>
        We&apos;ll send a pin in your email. Use it to log in your student portal and in the kiosk.
      </p>

      <button
        type="button"
        onClick={onBackToLogin}
        style={{
          marginTop: 32, height: 52, borderRadius: 10, border: 'none',
          background: '#4F46E5', color: '#FFFFFF',
          fontFamily: 'var(--font-display, sans-serif)',
          fontSize: 16, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 150ms ease, transform 80ms ease',
          width: '100%',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#4338CA' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#4F46E5' }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        Go to sign in →
      </button>
    </>
  )
}

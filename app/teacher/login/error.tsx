'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Teacher login error:', error)
  }, [error])

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
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(239,68,68,0.10)', color: '#EF4444',
          marginBottom: 16,
        }}>
          <AlertCircle size={28} />
        </div>
        
        <h2 style={{
          fontSize: 20, fontWeight: 700, color: '#F1F5F9',
          margin: '0 0 12px',
        }}>
          Something went wrong
        </h2>
        
        <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 24px' }}>
          We encountered an unexpected error loading the login page.
        </p>

        <button
          onClick={() => reset()}
          style={{
            padding: '12px 24px', borderRadius: 10,
            background: '#4D9FFF', color: '#0A1628',
            fontSize: 14, fontWeight: 700,
            border: 'none', cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  )
}

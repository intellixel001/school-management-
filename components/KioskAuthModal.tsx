'use client'

import { useState, useEffect } from 'react'

interface KioskAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function Spinner() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
      style={{ animation: 'kauth-spin 0.75s linear infinite', flexShrink: 0 }}
    >
      <style>{`@keyframes kauth-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

export default function KioskAuthModal({ isOpen, onClose, onSuccess }: KioskAuthModalProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setPin('')
      setError('')
      setIsVerifying(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const expectedPin = process.env.NEXT_PUBLIC_KIOSK_AUTH_PIN || '7858'

  function handlePinChange(val: string) {
    const clean = val.replace(/\D/g, '').slice(0, 4)
    setPin(clean)
    if (error) setError('')

    if (clean.length === 4) {
      setIsVerifying(true)
      setTimeout(() => {
        if (clean === expectedPin) {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('kiosk_authorized', 'true')
          }
          setIsVerifying(false)
          onSuccess()
        } else {
          setError('Incorrect authorization PIN. Please try again.')
          setIsVerifying(false)
          setPin('')
        }
      }, 300)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN')
      return
    }
    handlePinChange(pin)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(12, 7, 16, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      />

      {/* Modal Shell */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 440,
        background: '#1A0F1D',
        border: '1px solid rgba(232, 185, 108, 0.35)',
        borderRadius: 20,
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 230, 180, 0.15)',
        padding: 36,
        color: '#F5EDD8',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', color: 'rgba(245, 237, 216, 0.5)',
            fontSize: 22, cursor: 'pointer', padding: 8, lineHeight: 1,
            borderRadius: '50%', transition: 'color 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#F5EDD8' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(245, 237, 216, 0.5)' }}
        >
          ✕
        </button>

        {/* Lock Icon */}
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(232, 185, 108, 0.12)',
          border: '1px solid rgba(232, 185, 108, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, color: '#E8B96C', marginBottom: 20,
        }}>
          🔒
        </div>

        <h3 style={{
          fontFamily: 'var(--font-display, sans-serif)',
          fontSize: 24, fontWeight: 700, margin: 0,
          color: '#FBF3E2',
        }}>
          Kiosk Authorization
        </h3>

        <p style={{
          fontFamily: 'var(--font-body, sans-serif)',
          fontSize: 14, color: 'rgba(245, 237, 216, 0.65)', marginTop: 8, marginBottom: 0,
          lineHeight: 1.5,
        }}>
          Enter the 4-digit staff PIN to launch kiosk mode.
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%', marginTop: 28 }}>
          {/* 4-Digit Input Display */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
            {[0, 1, 2, 3].map((idx) => {
              const digit = pin[idx] || ''
              const isCurrent = pin.length === idx
              return (
                <div
                  key={idx}
                  style={{
                    width: 54, height: 64, borderRadius: 12,
                    border: `2px solid ${
                      error
                        ? '#E4736A'
                        : digit || isCurrent
                        ? '#E8B96C'
                        : 'rgba(198, 158, 92, 0.32)'
                    }`,
                    background: digit ? '#E8B96C' : 'rgba(15, 8, 12, 0.5)',
                    color: digit ? '#1A0F07' : '#F5EDD8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, fontWeight: 800,
                    fontFamily: 'var(--font-mono, monospace)',
                    boxShadow: digit ? '0 0 16px rgba(232, 185, 108, 0.4)' : 'none',
                    transition: 'all 150ms ease',
                  }}
                >
                  {digit ? '•' : ''}
                </div>
              )
            })}
          </div>

          {/* Hidden text input for keyboard entry */}
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            value={pin}
            autoFocus
            onChange={(e) => handlePinChange(e.target.value)}
            style={{
              position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1,
            }}
          />

          {/* Keypad for touch screen / click entry */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
            maxWidth: 260, margin: '0 auto', marginTop: 16,
          }}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((btn) => (
              <button
                key={btn}
                type="button"
                onClick={() => {
                  if (btn === 'C') {
                    setPin('')
                    if (error) setError('')
                  } else if (btn === '⌫') {
                    handlePinChange(pin.slice(0, -1))
                  } else {
                    handlePinChange(pin + btn)
                  }
                }}
                style={{
                  height: 48, borderRadius: 10, border: '1px solid rgba(198, 158, 92, 0.25)',
                  background: 'rgba(255, 255, 255, 0.05)', color: '#F5EDD8',
                  fontFamily: 'var(--font-mono, monospace)', fontSize: 18, fontWeight: 700,
                  cursor: 'pointer', transition: 'background 150ms ease, transform 80ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(232, 185, 108, 0.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)' }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)' }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {btn}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              marginTop: 16, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(228, 115, 106, 0.15)', border: '1px solid rgba(228, 115, 106, 0.3)',
              color: '#E4736A', fontSize: 13, fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          {isVerifying && (
            <div style={{
              marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: '#E8B96C', fontSize: 13, fontWeight: 600,
            }}>
              <Spinner /> Authorizing…
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

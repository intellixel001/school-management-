'use client'

import { useEffect, useRef } from 'react'
import { CheckCircle } from 'lucide-react'

interface ToastProps {
  message: string
  show: boolean
  onDismiss: () => void
}

export function Toast({ message, show, onDismiss }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (show) {
      timerRef.current = setTimeout(onDismiss, 3000)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [show, onDismiss])

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'fixed', top: 20, right: 24, zIndex: 9999,
        pointerEvents: show ? 'auto' : 'none',
        transform: show ? 'translateY(0) scale(1)' : 'translateY(-110%) scale(0.95)',
        opacity: show ? 1 : 0,
        transition: 'transform 260ms cubic-bezier(0.34,1.56,0.64,1), opacity 220ms ease',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 18px',
        background: '#0A1628',
        border: '1px solid rgba(16,185,129,0.25)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.04)',
        minWidth: 260,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(16,185,129,0.14)',
          border: '1px solid rgba(16,185,129,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 10px rgba(16,185,129,0.20)',
        }}>
          <CheckCircle size={15} style={{ color: '#10B981' }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#F1F5F9' }}>
          {message}
        </span>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MockSessionTimer } from './MockSessionTimer'

interface MockSessionHeaderProps {
  title: string
  secondsRemaining: number
  onEndSession?: () => void
  endWarningText?: string
}

    export function MockSessionHeader({ title, secondsRemaining, onEndSession, endWarningText }: MockSessionHeaderProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)

  function handleEndClick() {
    if (onEndSession) {
      onEndSession()
    } else {
      setShowConfirm(true)
    }
  }

  function handleConfirmEnd() {
    router.push('/kiosk/mock')
  }

  return (
    <>
      <header 
        className="flex items-center justify-between sticky top-0 bg-[#FAFAFA]" 
        style={{ height: 100, padding: '0 32px', borderBottom: '1px solid rgba(0,0,0,0.08)', zIndex: 100 }}
      >
        <div style={{ flex: '0 0 auto' }}>
          <MockSessionTimer secondsRemaining={secondsRemaining} />
        </div>
        
        <h1 className="font-display font-semibold m-0 text-center flex-1" style={{ fontSize: 24, color: 'var(--text-primary)' }}>
          {title}
        </h1>
        
        <button 
          onClick={handleEndClick}
          className="font-body font-medium transition-transform active:scale-95"
          style={{ 
            fontSize: 19, 
            color: '#DC2626', 
            padding: '12px 25px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 10,
            cursor: 'pointer'
          }}
        >
          End Session
        </button>
      </header>

      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-[20px] p-10 max-w-lg w-full mx-4 shadow-xl">
            <h2 className="font-display font-bold text-[28px] mb-4">Leave this session?</h2>
            <p className="font-body text-gray-600 mb-10" style={{ fontSize: 20, lineHeight: 1.5 }}>
              {endWarningText || 'Your answers will be lost. This is a formal mock exam — you cannot retake it.'}
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-4 px-6 rounded-xl font-body font-medium"
                style={{ fontSize: 20, background: 'rgba(0,0,0,0.05)', color: 'var(--text-primary)' }}
              >
                Continue session
              </button>
              <button 
                onClick={handleConfirmEnd}
                className="flex-1 py-4 px-6 rounded-xl font-body font-medium text-white"
                style={{ fontSize: 20, background: 'var(--accent-danger)' }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

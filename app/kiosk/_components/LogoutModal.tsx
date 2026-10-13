'use client'

import { LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen && mounted) {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      gsap.fromTo(cardRef.current, 
        { opacity: 0, scale: 0.95, y: 10 }, 
        { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: 'back.out(1.2)' }
      )
    }
  }, [isOpen])

  const handleClose = () => {
    gsap.to(cardRef.current, { opacity: 0, scale: 0.98, y: -5, duration: 0.2, ease: 'power2.in' })
    gsap.to(backdropRef.current, { 
      opacity: 0, duration: 0.3, ease: 'power2.inOut', 
      onComplete: onClose 
    })
  }

  const handleConfirm = () => {
    gsap.to(cardRef.current, { opacity: 0, scale: 0.98, y: -5, duration: 0.2, ease: 'power2.in' })
    gsap.to(backdropRef.current, { 
      opacity: 0, duration: 0.3, ease: 'power2.inOut', 
      onComplete: onConfirm 
    })
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <div
      ref={backdropRef}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(32px) saturate(140%)',
        WebkitBackdropFilter: 'blur(32px) saturate(140%)',
      }}
      onClick={handleClose}
    >
      <div
        ref={cardRef}
        style={{
          width: 560,
          background: 'rgba(30, 32, 45, 0.75)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
          borderRadius: 32,
          padding: 56,
          textAlign: 'center',
          color: 'white'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.15)', 
            padding: 24, 
            borderRadius: '50%',
            boxShadow: '0 0 40px rgba(239, 68, 68, 0.2)'
          }}>
            <LogOut size={64} color="#EF4444" />
          </div>
        </div>
        <h2 className="font-display font-bold" style={{ fontSize: 44, marginBottom: 16 }}>Log Out?</h2>
        <p className="font-body" style={{ fontSize: 26, color: 'rgba(255,255,255,0.7)', marginBottom: 48, lineHeight: 1.4 }}>
          This will end your session and return you to the PIN screen.
        </p>
        <div style={{ display: 'flex', gap: 20 }}>
          <button
            onClick={handleClose}
            className="font-display font-bold active:scale-[0.97]"
            style={{
              flex: 1, height: 88, fontSize: 28, borderRadius: 24,
              background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: 'none', cursor: 'pointer',
              transition: 'transform 0.1s'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="font-display font-bold active:scale-[0.97]"
            style={{
              flex: 1, height: 88, fontSize: 28, borderRadius: 24,
              background: '#EF4444', color: 'white', border: 'none', cursor: 'pointer',
              boxShadow: '0 12px 32px rgba(239, 68, 68, 0.3)',
              transition: 'transform 0.1s'
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

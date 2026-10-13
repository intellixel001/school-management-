'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { clearTokens } from '@/lib/api/tokens'
import { logoutApi } from '@/lib/services/auth'
import type { Student } from '@/types/platform'

export interface KioskSession {
  studentId: string
  studentName: string    // for greeting display
  email: string
  level: Student['level']
  startedAt: number
}

interface ContextValue {
  session: KioskSession | null
  setSession: (s: KioskSession) => void
  clear: () => void
}

const KioskSessionContext = createContext<ContextValue | null>(null)

const STORAGE_KEY = 'kiosk_session'

function readStorage(): KioskSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as KioskSession) : null
  } catch {
    return null
  }
}

function writeStorage(s: KioskSession): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* quota full */ }
}

function removeStorage(): void {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

export function KioskSessionProvider({ children }: { children: React.ReactNode }) {
  // Read localStorage in the state initializer. Kiosk child pages perform
  // redirect checks in effects, so waiting for a later provider effect created
  // a race where refresh/direct navigation could wrongly return to /kiosk.
  const [session, setSessionState] = useState<KioskSession | null>(() => readStorage())

  const setSession = useCallback((s: KioskSession) => {
    writeStorage(s)
    setSessionState(s)
  }, [])

  // clear() ends the session — called by the logout button and return-to-login.
  const clear = useCallback(() => {
    removeStorage()
    clearTokens()
    logoutApi().catch(() => {})
    setSessionState(null)
  }, [])

  return (
    <KioskSessionContext.Provider value={{ session, setSession, clear }}>
      {children}
    </KioskSessionContext.Provider>
  )
}

export function useKioskSession() {
  const ctx = useContext(KioskSessionContext)
  if (!ctx) throw new Error('useKioskSession must be used inside KioskSessionProvider')
  return ctx
}

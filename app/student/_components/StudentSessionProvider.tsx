'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { logoutApi } from '@/lib/services/auth'

const STORAGE_KEY = 'ec-student-session'

export interface StudentSession {
  studentId: string
  email: string
  loggedInAt: number
  /**
   * TODO Phase 11 (Django backend): replace with { accessToken, refreshToken, expiresAt }.
   * For now, presence of session means "logged in." No expiry.
   */
}

interface ContextValue {
  session: StudentSession | null
  isHydrated: boolean
  setSession: (s: StudentSession) => void
  logout: () => void
}

const StudentSessionContext = createContext<ContextValue | null>(null)

export function StudentSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [session, setSessionState] = useState<StudentSession | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate from localStorage on mount — never in render, always in effect.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as StudentSession
        if (
          parsed &&
          typeof parsed.studentId === 'string' &&
          typeof parsed.email === 'string'
        ) {
          setSessionState(parsed)
        }
      }
    } catch {
      // Corrupted storage — clear it silently.
      localStorage.removeItem(STORAGE_KEY)
    }
    setIsHydrated(true)
  }, [])

  /** The ONLY function that writes to localStorage. */
  const setSession = useCallback((s: StudentSession) => {
    setSessionState(s)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
      // Storage full or disabled — session works in-memory only for this page lifetime.
    }
  }, [])

  /** The ONLY function that removes from localStorage. */
  const logout = useCallback(() => {
    // Fire-and-forget: wipes tokens client-side even if backend is unreachable.
    void logoutApi()
    setSessionState(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch { /* noop */ }
    router.push('/student/login')
  }, [router])

  return (
    <StudentSessionContext.Provider value={{ session, isHydrated, setSession, logout }}>
      {children}
    </StudentSessionContext.Provider>
  )
}

export function useStudentSession() {
  const ctx = useContext(StudentSessionContext)
  if (!ctx) {
    throw new Error('useStudentSession must be used inside StudentSessionProvider')
  }
  return ctx
}

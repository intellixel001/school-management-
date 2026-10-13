'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { logoutApi } from '@/lib/services/auth'
import type { Teacher } from '@/types/platform'

interface TeacherSession {
  teacherId: string
  name: string
  email: string
  pendingReviews?: number
}

interface TeacherSessionContextValue {
  session: TeacherSession | null
  setSession: (s: TeacherSession | null) => void
  logout: () => void
  isLoading: boolean
}

const TeacherSessionContext = createContext<TeacherSessionContextValue | null>(null)

const STORAGE_KEY = 'ec-teacher-session'

export function TeacherSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [session, setSessionState] = useState<TeacherSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as TeacherSession
        if (parsed && typeof parsed.teacherId === 'string') {
          setSessionState(parsed)
        }
      }
    } catch {
      // Corrupt entry — wipe it
      localStorage.removeItem(STORAGE_KEY)
    }
    setIsLoading(false)
  }, [])

  const setSession = (s: TeacherSession | null) => {
    setSessionState(s)
    if (s) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const logout = () => {
    // Fire-and-forget the backend logout call — it clears tokens locally too.
    // We don't await it because navigation shouldn't be blocked by network.
    void logoutApi()
    setSession(null)
    router.push('/teacher/login')
  }

  return (
    <TeacherSessionContext.Provider value={{ session, setSession, logout, isLoading }}>
      {children}
    </TeacherSessionContext.Provider>
  )
}

export function useTeacherSession(): TeacherSessionContextValue {
  const ctx = useContext(TeacherSessionContext)
  if (!ctx) throw new Error('useTeacherSession must be used inside TeacherSessionProvider')
  return ctx
}

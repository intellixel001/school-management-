'use client'

import { useEffect, useState } from 'react'
import { getStudentById, getSessionsByStudentId } from '@/lib/services'
import { ResultsList } from './_components/ResultsList'
import { Spinner } from '@/components/ui'
import Link from 'next/link'
import { useStudentSession } from '../_components/StudentSessionProvider'
import type { Student, Session } from '@/types/platform'

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const { session } = useStudentSession()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!session) return
    let cancelled = false

    async function load() {
      try {
        const s = await getStudentById(session!.studentId)
        if (cancelled) return
        if (!s) { setError('Student data not found'); setIsLoading(false); return }
        const allSessions = await getSessionsByStudentId(s.id)
        if (cancelled) return
        const completed = allSessions
          .filter(sess => sess.status === 'completed' && sess.source === 'practice')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setSessions(completed)
      } catch {
        if (!cancelled) setError('Failed to load results')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [session])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280 }}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 64, textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-display)' }}>
          {error}
        </div>
        <Link href="/student/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '10px 22px', borderRadius: 10,
          background: '#6366F1', color: '#FFFFFF',
          textDecoration: 'none', fontSize: 14, fontWeight: 700,
        }}>
          ← Back to Login
        </Link>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>

      {/* Page heading */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 26,
          fontWeight: 800, color: '#0F172A', margin: 0,
        }}>
          My Results
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 14,
          color: '#94A3B8', marginTop: 5, marginBottom: 0,
        }}>
          {sessions.length} completed practice session{sessions.length !== 1 ? 's' : ''} from the kiosk
        </p>
      </div>

      <ResultsList sessions={sessions} />
    </div>
  )
}

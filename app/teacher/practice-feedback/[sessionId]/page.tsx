'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSessionById, getStudentById, submitPracticeFeedback } from '@/lib/services'
import { SessionContextPanel } from '../_components/SessionContextPanel'
import { AiOverviewPanel }    from '../_components/AiOverviewPanel'
import { PracticeFeedbackForm } from '../_components/PracticeFeedbackForm'
import { Spinner } from '@/components/ui'
import Link from 'next/link'
import type { Session, Student } from '@/types/platform'

// ── Component ─────────────────────────────────────────────────────────────────

export default function PracticeFeedbackDetailPage() {
  const router   = useRouter()
  const params   = useParams()
  const sessionId = params.sessionId as string

  const [session,  setSession]  = useState<Session | null>(null)
  const [student,  setStudent]  = useState<Student | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const s = await getSessionById(sessionId)
        if (cancelled) return
        if (!s) {
          setError('Session not found')
          setLoading(false)
          return
        }
        const stu = await getStudentById(s.studentId)
        if (cancelled) return
        setSession(s)
        setStudent(stu)
      } catch {
        if (!cancelled) setError('Failed to load session')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [sessionId])

  const handleSave = useCallback(async (feedback: string) => {
    if (!session) return
    await submitPracticeFeedback(session.id, feedback)
    // Brief delay so the toast is readable, then navigate
    await new Promise(r => setTimeout(r, 1500))
    router.push('/teacher/practice-feedback')
  }, [session, router])

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
        <Spinner size="lg" />
      </div>
    )
  }

  // ── Error / not found ─────────────────────────────────────────────────────

  if (error || !session || !student) {
    return (
      <div style={{
        textAlign: 'center', padding: '48px 24px',
        background: 'var(--bg-surface)', borderRadius: 14,
        border: '1px solid var(--border-default)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          {error ?? 'Session not found'}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
          This session may not exist or may have already been reviewed.
        </p>
        <Link
          href="/teacher/practice-feedback"
          style={{
            fontSize: 13, fontWeight: 600, color: '#4D9FFF',
            textDecoration: 'none',
            background: 'rgba(77,159,255,0.08)',
            borderRadius: 8, padding: '8px 16px',
            border: '1px solid rgba(77,159,255,0.18)',
          }}
        >
          ← Back to queue
        </Link>
      </div>
    )
  }

  // ── Main view ─────────────────────────────────────────────────────────────

  return (
    <div style={{ width: '100%', maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Back link */}
      <Link
        href="/teacher/practice-feedback"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 13, color: '#64748B', textDecoration: 'none',
          fontWeight: 500,
        }}
      >
        ← Back to queue
      </Link>

      {/* Session context card */}
      <SessionContextPanel session={session} student={student} />

      {/* AI Overview panel — between context and feedback form */}
      <AiOverviewPanel
        session={session}
        onSessionUpdate={setSession}
      />

      {/* Feedback form */}
      <PracticeFeedbackForm
        initialValue={session.teacherFeedback ?? ''}
        onSave={handleSave}
      />

    </div>
  )
}

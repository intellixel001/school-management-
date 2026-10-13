'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Spinner } from '@/components/ui'
import { getMockExam, getStudentMockAttempts, createMockSectionAttempt } from '@/lib/services'
import { useKioskSession } from '../../../../_components/KioskSessionProvider'
import type { MockExam, MockSectionAttempt } from '@/types/platform'

import ReadingSessionScreen from './_components/ReadingSessionScreen'
import ListeningSessionScreen from './_components/ListeningSessionScreen'
import WritingSessionScreen from './_components/WritingSessionScreen'

const VALID_SKILLS = new Set(['reading', 'listening', 'writing'])

export default function MockSessionRouterPage() {
  const params = useParams()
  const router = useRouter()
  const { session: kioskSession } = useKioskSession()

  const mockId = params.mockId as string
  const skill = params.skill as string

  const [mock, setMock] = useState<MockExam | null>(null)
  const [attempt, setAttempt] = useState<MockSectionAttempt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!kioskSession) { router.replace('/kiosk'); return }
    if (!VALID_SKILLS.has(skill)) { router.replace('/kiosk/mock'); return }

    let cancelled = false

    async function init() {
      const m = await getMockExam(mockId)
      if (cancelled) return
      if (!m || m.status === 'locked') {
        setError('This mock exam is not available yet.')
        setLoading(false)
        return
      }

      // Check for existing attempt; resume if in-progress, block if submitted+
      const all = await getStudentMockAttempts(kioskSession!.studentId)
      const existing = all.find(a => a.mockExamId === mockId && a.skill === skill)

      if (existing) {
        if (existing.status === 'in-progress') {
          // Resume — for Mock-phase-2 we don't fully resume, just continue with empty answers
          // Mock-phase-5b adds proper resume
          if (!cancelled) { setMock(m); setAttempt(existing); setLoading(false) }
          return
        }
        // Already submitted/reviewed — block and route back to picker
        if (!cancelled) {
          setError(`You've already submitted this ${skill} section.`)
          setLoading(false)
        }
        return
      }

      // Create new attempt
      try {
        const newAttempt = await createMockSectionAttempt(kioskSession!.studentId, mockId, skill as 'reading' | 'listening' | 'writing')
        if (!cancelled) { setMock(m); setAttempt(newAttempt); setLoading(false) }
      } catch (e) {
        if (!cancelled) {
          setError('Could not start the session. Please try again.')
          setLoading(false)
        }
      }
    }
    init()
    return () => { cancelled = true }
  }, [kioskSession, mockId, skill, router])

  if (loading) {
    return <div className="flex items-center justify-center w-full h-full bg-[#FAFAFA]"><Spinner size="lg" /></div>
  }
  
  if (error || !mock || !attempt) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-6 px-8 text-center bg-[#FAFAFA]">
        <div style={{ fontSize: 28 }}>⚠</div>
        <p className="font-body" style={{ fontSize: 16 }}>{error || 'Could not load session.'}</p>
        <button onClick={() => router.push('/kiosk/mock')} className="px-6 py-3 rounded-md text-white font-medium shadow-sm transition-transform active:scale-95" style={{ background: 'var(--accent-primary)' }}>Back to mock list</button>
      </div>
    )
  }

  // Dispatch to skill-specific component
  if (skill === 'reading' && mock.reading) {
    return <ReadingSessionScreen mock={mock} attempt={attempt} reading={mock.reading} />
  }

  if (skill === 'listening' && mock.listening) {
    return <ListeningSessionScreen mock={mock} attempt={attempt} listening={mock.listening} />
  }

  if (skill === 'writing' && mock.writing) {
    return <WritingSessionScreen mock={mock} attempt={attempt} writing={mock.writing} />
  }

  // Writing: will be added in 4
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-6 px-8 text-center bg-[#FAFAFA]">
      <p className="font-body">This section is coming soon.</p>
      <button onClick={() => router.push('/kiosk/mock')} className="underline text-gray-600 font-body">Back</button>
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Headphones, PenLine, ChevronRight } from 'lucide-react'
import { Spinner, Badge, BlueBackButton } from '@/components/ui'
import { getMockExams, getStudentMockAttempts } from '@/lib/services'
import { useTransition } from '../_components/TransitionProvider'
import { useKioskSession } from '../_components/KioskSessionProvider'
import type { MockExam, MockSectionAttempt } from '@/types/platform'

type SectionStatus = 'not-started' | 'in-progress' | 'awaiting-review' | 'reviewed'

function getSectionStatus(
  mockId: string,
  skill: 'reading' | 'listening' | 'writing',
  attempts: MockSectionAttempt[]
): SectionStatus {
  const attempt = attempts.find(a => a.mockExamId === mockId && a.skill === skill)
  if (!attempt) return 'not-started'
  if (attempt.status === 'in-progress') return 'in-progress'
  if (attempt.status === 'submitted' || attempt.status === 'ai-graded') return 'awaiting-review'
  if (attempt.status === 'reviewed') return 'reviewed'
  return 'not-started'
}

export default function KioskMockPickerPage() {
  const router = useRouter()
  const { playTransition, signalMounted } = useTransition()
  const { session: kioskSession } = useKioskSession()
  
  const [mocks, setMocks] = useState<MockExam[]>([])
  const [attempts, setAttempts] = useState<MockSectionAttempt[]>([])
  const [loading, setLoading] = useState(true)

  // Signal ready only once the mock exam list has finished loading, so the
  // transition overlay never reveals our own local spinner.
  useEffect(() => {
    if (loading) return
    const id = requestAnimationFrame(() => signalMounted())
    return () => cancelAnimationFrame(id)
  }, [loading, signalMounted])

  const loadData = async () => {
    if (!kioskSession) return
    try {
      const [m, a] = await Promise.all([
        getMockExams(),
        getStudentMockAttempts(kioskSession.studentId)
      ])
      setMocks(m)
      setAttempts(a)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!kioskSession) {
      router.replace('/kiosk')
      return
    }
    loadData()
  }, [kioskSession, router])

  // Auto-refresh on focus
  useEffect(() => {
    function onFocus() {
      if (kioskSession) {
        getStudentMockAttempts(kioskSession.studentId).then(setAttempts)
      }
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [kioskSession])

  if (loading || mocks.length === 0) {
    return <div className="flex items-center justify-center w-full h-full bg-[#FAFAFA]"><Spinner size="lg" /></div>
  }

  return (
    <div className="flex flex-col w-full h-[100dvh] overflow-hidden bg-[#FAFAFA] text-[#1A1A1A]">
      {/* Header */}
      <header
        className="relative flex items-center justify-between shrink-0 border-b border-black/10 z-10 bg-white"
        style={{ height: 120, padding: '0 32px' }}
      >
        <div style={{ width: 140 }} />
        <h1
          className="font-display font-bold m-0 absolute left-1/2 -translate-x-1/2"
          style={{ fontSize: 34, color: '#0F172A', letterSpacing: '-0.01em' }}
        >
          Mock Exams
        </h1>
        {/* Right-side spacer matches the back button's approximate width so the
            absolutely-centered title stays visually balanced. */}
        <div style={{ width: 220 }} />
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-8 py-10">
        <div className="mx-auto flex flex-col gap-8 pb-24" style={{ maxWidth: 900 }}>

          {mocks.map((mock) => {
            const isLocked = mock.status === 'locked'

            if (isLocked) {
              return (
                <div
                  key={mock.id}
                  className="bg-white border border-black/5 rounded-3xl shadow-sm opacity-60"
                  style={{ padding: '28px 36px' }}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-semibold m-0" style={{ fontSize: 26 }}>{mock.title}</h2>
                    <Badge variant="warning" size="md">Coming soon</Badge>
                  </div>
                </div>
              )
            }

            // Active mock
            const readStatus = getSectionStatus(mock.id, 'reading', attempts)
            const listStatus = getSectionStatus(mock.id, 'listening', attempts)
            const writStatus = getSectionStatus(mock.id, 'writing', attempts)

            const renderRow = (
              skill: 'reading' | 'listening' | 'writing', 
              status: SectionStatus, 
              Icon: React.ElementType, 
              label: string, 
              color: string,
              isAvailablePhase: boolean,
              attempt?: MockSectionAttempt
            ) => {
              const isActive = isAvailablePhase && status !== 'awaiting-review'
              const isComingSoon = !isAvailablePhase

              let statusText = ''
              let actionNode = null

              if (isComingSoon) {
                statusText = 'Coming soon'
              } else if (status === 'not-started') {
                statusText = 'Not started'
                actionNode = <ChevronRight size={28} style={{ color }} />
              } else if (status === 'in-progress') {
                statusText = 'In progress'
                actionNode = <span className="font-semibold flex items-center gap-2" style={{ color, fontSize: 18 }}>Resume <ChevronRight size={22} /></span>
              } else if (status === 'awaiting-review') {
                statusText = 'Submitted'
                actionNode = <span className="text-gray-400 font-medium" style={{ fontSize: 16 }}>Awaiting review</span>
              } else if (status === 'reviewed' && attempt) {
                const band = attempt.teacherFinalBand ?? attempt.teacherFinalWritingScore?.bands.overallBand ?? attempt.ieltsBand
                statusText = band != null ? `Band ${band} ✓` : 'Reviewed'
                actionNode = <span className="text-green-600 font-semibold flex items-center gap-2" style={{ fontSize: 18 }}>View score <ChevronRight size={22} /></span>
              }

              const handleClick = () => {
                if (!isActive) return
                if (status === 'reviewed') {
                  router.push(`/kiosk/mock/${mock.id}/${skill}/submitted`)
                } else {
                  router.push(`/kiosk/mock/${mock.id}/${skill}/take`)
                }
              }

              // Each row now carries a tinted background matching its skill accent
              // (~10% opacity fill + subtle border), so Reading/Listening/Writing
              // are visually distinct at a glance instead of a uniform grey stack.
              return (
                <div
                  onClick={handleClick}
                  className={`flex items-center justify-between transition-all ${isActive ? 'cursor-pointer active:scale-[0.99]' : 'opacity-60'}`}
                  style={{
                    padding: '24px 28px',
                    borderRadius: 22,
                    background: `${color}14`,
                    border: `1px solid ${color}33`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) return
                    e.currentTarget.style.background = `${color}22`
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) return
                    e.currentTarget.style.background = `${color}14`
                  }}
                >
                  <div className="flex items-center gap-6">
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 76, height: 76,
                        borderRadius: 20,
                        background: `${color}22`,
                        color,
                        boxShadow: `0 6px 16px ${color}22`,
                      }}
                    >
                      <Icon size={38} />
                    </div>
                    <div>
                      <div className="font-body font-semibold" style={{ fontSize: 26, color: '#0F172A' }}>{label}</div>
                      <div className="font-body text-gray-500" style={{ fontSize: 17, marginTop: 4 }}>{statusText}</div>
                    </div>
                  </div>
                  <div>
                    {actionNode}
                  </div>
                </div>
              )
            }

            return (
              <div
                key={mock.id}
                className="bg-white border border-black/10 rounded-3xl shadow-sm"
                style={{ padding: 20 }}
              >
                <div className="border-b border-black/5" style={{ padding: '16px 20px 24px' }}>
                  <h2 className="font-display font-semibold m-0" style={{ fontSize: 34 }}>{mock.title}</h2>
                </div>
                <div className="flex flex-col" style={{ gap: 14, paddingTop: 20 }}>
                  {renderRow('reading', readStatus, BookOpen, 'Reading', '#6366F1', !!mock.reading, attempts.find(a => a.mockExamId === mock.id && a.skill === 'reading'))}
                  {renderRow('listening', listStatus, Headphones, 'Listening', '#8B5CF6', !!mock.listening, attempts.find(a => a.mockExamId === mock.id && a.skill === 'listening'))}
                  {renderRow('writing', writStatus, PenLine, 'Writing', '#F59E0B', !!mock.writing, attempts.find(a => a.mockExamId === mock.id && a.skill === 'writing'))}
                </div>
              </div>
            )
          })}

        </div>
      </div>

      {/* Bottom-left back button */}
      <div className="absolute z-50" style={{ bottom: 48, left: 48 }}>
        <BlueBackButton
          label="Back to menu"
          onClick={async () => {
            await playTransition('lightpage-to-menu', { accentColor: '#FBBF24' })
            router.push('/kiosk/menu')
          }}
        />
      </div>
    </div>
  )
}

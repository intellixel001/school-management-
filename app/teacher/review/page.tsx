'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getPendingMockReviews, getStudents, getMockExams } from '@/lib/services'
import type { MockSectionAttempt, Student, SkillArea } from '@/types/platform'
import { BookOpen, Headphones, PenLine } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { TeacherPageHero } from '../_components/TeacherPageHero'

interface ReviewCard {
  studentId: string
  studentName: string
  studentEmail: string
  mockId: string
  mockTitle: string
  attempts: MockSectionAttempt[]
  latestSubmittedAt: number
}

function groupAttempts(
  attempts: MockSectionAttempt[],
  students: Student[],
  mocks: any[],
  filters: { mockFilter: string; skillFilter: SkillArea | 'all'; sortBy: 'newest' | 'oldest' | 'student' }
): ReviewCard[] {
  const map = new Map<string, ReviewCard>()
  for (const a of attempts) {
    if (filters.mockFilter !== 'all' && a.mockExamId !== filters.mockFilter) continue
    if (filters.skillFilter !== 'all' && a.skill !== filters.skillFilter) continue

    const student = students.find(s => s.id === a.studentId)
    if (!student) continue
    const mock = mocks.find(m => m.id === a.mockExamId)
    const mockTitle = mock?.title || a.mockExamId

    const key = `${a.studentId}__${a.mockExamId}`
    let card = map.get(key)
    if (!card) {
      card = {
        studentId: a.studentId,
        studentName: student.name,
        studentEmail: student.email,
        mockId: a.mockExamId,
        mockTitle,
        attempts: [],
        latestSubmittedAt: 0,
      }
      map.set(key, card)
    }
    card.attempts.push(a)
    const ts = a.submittedAt ? new Date(a.submittedAt).getTime() : 0
    if (ts > card.latestSubmittedAt) card.latestSubmittedAt = ts
  }

  const cards = Array.from(map.values())
  switch (filters.sortBy) {
    case 'newest': cards.sort((a, b) => b.latestSubmittedAt - a.latestSubmittedAt); break
    case 'oldest': cards.sort((a, b) => a.latestSubmittedAt - b.latestSubmittedAt); break
    case 'student': cards.sort((a, b) => a.studentName.localeCompare(b.studentName)); break
  }
  return cards
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  return `${m}m`
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function scoreSummaryForAttempt(a: MockSectionAttempt): string {
  if (a.skill === 'writing') {
    const overall = a.writingAiScore?.bands.overallBand
    return overall != null ? `Band ${overall} (AI provisional) · ${formatDuration(a.durationSeconds)} · ${timeAgo(a.submittedAt)}` : 'Awaiting AI score'
  }
  // Reading or Listening
  const raw = a.rawScore
  const band = a.ieltsBand
  if (raw != null && band != null) {
    return `${raw}/${a.totalQuestions} · Band ${band} · ${formatDuration(a.durationSeconds)} · ${timeAgo(a.submittedAt)}`
  }
  return 'Pending grade'
}

function SkillIcon({ skill }: { skill: string }) {
  if (skill === 'reading') return <BookOpen size={18} color="#4F46E5" />
  if (skill === 'listening') return <Headphones size={18} color="#7C3AED" />
  if (skill === 'writing') return <PenLine size={18} color="#D97706" />
  return null
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function TeacherMockReviewPage() {
  const router = useRouter()
  const [attempts, setAttempts] = useState<MockSectionAttempt[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [mocks, setMocks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [mockFilter, setMockFilter] = useState<string>('all')
  const [skillFilter, setSkillFilter] = useState<SkillArea | 'all'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'student'>('newest')

  useEffect(() => {
    let cancelled = false
    Promise.all([getPendingMockReviews(), getStudents(), getMockExams()]).then(([a, s, m]) => {
      if (!cancelled) {
        setAttempts(a)
        setStudents(s)
        setMocks(m)
        setIsLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  const grouped = useMemo(
    () => groupAttempts(attempts, students, mocks, { mockFilter, skillFilter, sortBy }), 
    [attempts, students, mocks, mockFilter, skillFilter, sortBy]
  )

  const submittedToday = attempts.filter(a => {
    if (!a.submittedAt) return false
    const ms = Date.now() - new Date(a.submittedAt).getTime()
    return ms < 24 * 60 * 60 * 1000
  }).length

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto px-6 py-10" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        <TeacherPageHero
          eyebrow="Review Queue"
          title="Mock Reviews"
          subtitle={`${attempts.length} pending · ${submittedToday} submitted today`}
        />

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', 'mock-1', 'mock-2', 'mock-3', 'mock-4', 'mock-5'].map(m => {
               const label = m === 'all' ? 'All mocks' : (mocks.find(x => x.id === m)?.title || m)
               const active = mockFilter === m
               return (
                 <button key={m} onClick={() => setMockFilter(m)} style={{
                    padding: '5px 12px', borderRadius: 20,
                    border: `1.5px solid ${active ? 'rgba(77,159,255,0.60)' : 'var(--border-default)'}`,
                    background: active ? 'rgba(77,159,255,0.10)' : 'transparent',
                    color: active ? '#4D9FFF' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: active ? 700 : 400,
                    cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap',
                 }}>{label}</button>
               )
            })}
          </div>
          
          <div style={{ width: 1, height: 16, background: 'var(--border-default)', margin: '0 4px' }} />
          
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { v: 'all', l: 'All skills' },
              { v: 'reading', l: 'Reading' },
              { v: 'writing', l: 'Writing' },
              { v: 'listening', l: 'Listening' },
            ].map(s => {
               const active = skillFilter === s.v
               return (
                 <button key={s.v} onClick={() => setSkillFilter(s.v as any)} style={{
                    padding: '5px 12px', borderRadius: 20,
                    border: `1.5px solid ${active ? 'rgba(77,159,255,0.60)' : 'var(--border-default)'}`,
                    background: active ? 'rgba(77,159,255,0.10)' : 'transparent',
                    color: active ? '#4D9FFF' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: active ? 700 : 400,
                    cursor: 'pointer', outline: 'none', whiteSpace: 'nowrap',
                 }}>{s.l}</button>
               )
            })}
          </div>

          <div style={{ marginLeft: 'auto' }}>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'student')}
              style={{
                appearance: 'none', padding: '6px 24px 6px 12px',
                background: 'var(--bg-surface-2)', border: '1.5px solid var(--border-default)',
                borderRadius: 10, fontFamily: 'var(--font-body)',
                fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="student">Student name</option>
            </select>
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <h3 className="font-semibold text-lg mb-2">No pending reviews.</h3>
            <p className="text-gray-500">When students submit mock sections, they'll appear here for your review.</p>
          </div>
        ) : (
          <div>
            {grouped.map(card => (
              <div 
                key={`${card.studentId}-${card.mockId}`}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 14,
                  padding: 20,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>{card.studentName}</div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>{card.studentEmail}</div>
                  </div>
                  <div style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>{card.mockTitle}</div>
                </div>

                <div style={{ borderTop: '1px solid rgba(15, 23, 42, 0.06)', paddingTop: 12 }}>
                  {card.attempts.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(15, 23, 42, 0.04)' }}>
                      <SkillIcon skill={a.skill} />
                      <div style={{ flex: 1, marginLeft: 12 }}>
                        <div style={{ fontWeight: 500 }}>{capitalize(a.skill)}</div>
                        <div style={{ fontSize: 13, color: '#6B7280' }}>
                          {scoreSummaryForAttempt(a)}
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/teacher/review/${a.id}`)}
                        style={{
                          padding: '8px 16px',
                          background: '#4F46E5',
                          color: 'white',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        Review →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

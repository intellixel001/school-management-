'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { getStudentMockAttempts } from '@/lib/services'
import { overallMockBand } from '@/lib/scoring/ieltsBands'
import type { MockSectionAttempt } from '@/types/platform'

function mockTitleForId(id: string): string {
  const map: Record<string, string> = {
    'mock-1': 'Mock Test 1',
    'mock-2': 'Mock Test 2',
    'mock-3': 'Mock Test 3',
    'mock-4': 'Mock Test 4',
    'mock-5': 'Mock Test 5',
  }
  return map[id] || id
}

export function MyMockTestsCard({ studentId }: { studentId: string }) {
  const [attempts, setAttempts] = useState<MockSectionAttempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStudentMockAttempts(studentId).then(data => {
      setAttempts(data)
      setLoading(false)
    })
  }, [studentId])

  const byMock = useMemo(() => {
    const map = new Map<string, MockSectionAttempt[]>()
    for (const a of attempts) {
      if (!map.has(a.mockExamId)) map.set(a.mockExamId, [])
      map.get(a.mockExamId)!.push(a)
    }
    return Array.from(map.entries())
  }, [attempts])

  return (
    <div className="my-mock-tests-card-hover" style={{
      background: '#FFFFFF',
      borderRadius: 16,
      padding: '22px 24px',
      boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 0 0 1px rgba(99,102,241,0.10)',
      transition: 'box-shadow 200ms ease, transform 200ms ease',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 18,
      }}>
        <h2 style={{
          margin: 0, fontSize: 17, fontWeight: 700, color: '#0F172A',
          fontFamily: 'var(--font-display)',
        }}>
          My Mock Tests
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '28px 0', color: '#64748B', fontSize: 14 }}>
          Loading mock tests...
        </div>
      ) : byMock.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '28px 0', color: '#64748B', fontSize: 14 }}>
          No mock attempts yet. Head to the kiosk to take your first mock test.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {byMock.map(([mockId, mockAttempts]) => (
            <MockSummaryRow key={mockId} mockId={mockId} attempts={mockAttempts} />
          ))}
        </div>
      )}
    </div>
  )
}

function MockSummaryRow({ mockId, attempts }: { mockId: string, attempts: MockSectionAttempt[] }) {
  const reading = attempts.find(a => a.skill === 'reading')
  const listening = attempts.find(a => a.skill === 'listening')
  const writing = attempts.find(a => a.skill === 'writing')

  const overall = overallMockBand({
    reading: reading?.status === 'reviewed' ? reading.teacherFinalBand ?? null : null,
    listening: listening?.status === 'reviewed' ? listening.teacherFinalBand ?? null : null,
    writing: writing?.status === 'reviewed' ? writing.teacherFinalWritingScore?.bands.overallBand ?? null : null,
  })

  let bg = 'rgba(100,116,139,0.10)'
  let color = '#64748B'
  let text = 'Pending'

  if (overall !== null) {
    text = overall.toFixed(1)
    if (overall >= 7.0) {
      bg = 'rgba(16,185,129,0.10)'
      color = '#10B981'
    } else if (overall >= 5.5) {
      bg = 'rgba(245,158,11,0.10)'
      color = '#F59E0B'
    } else {
      bg = 'rgba(244,63,94,0.10)'
      color = '#F43F5E'
    }
  }

  return (
    <div style={{ 
      padding: 16, 
      border: '1px solid rgba(99,102,241,0.10)', 
      borderRadius: 12, 
      background: '#FFFFFF'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
          {mockTitleForId(mockId)}
        </h3>
        <div style={{ 
          fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)',
          color: color,
          background: bg,
          padding: '6px 14px', borderRadius: 10
        }}>
          {text}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <SectionRowSummary skill="reading" attempt={reading} />
        <SectionRowSummary skill="listening" attempt={listening} />
        <SectionRowSummary skill="writing" attempt={writing} />
      </div>
      
      <Link 
        href={`/student/mocks/${mockId}`}
        style={{ 
          display: 'inline-block', fontSize: 13, fontWeight: 600, color: '#6366F1', 
          textDecoration: 'none'
        }}
      >
        View details →
      </Link>
    </div>
  )
}

function SectionRowSummary({ skill, attempt }: { skill: string, attempt?: MockSectionAttempt }) {
  let label = 'Not started'
  let color = '#94A3B8'
  
  if (attempt) {
    if (attempt.status === 'in-progress') {
      label = 'In progress'
      color = '#F59E0B'
    } else if (attempt.status === 'submitted' || attempt.status === 'ai-graded') {
      label = 'Pending review'
      color = '#64748B'
    } else if (attempt.status === 'reviewed') {
      const band = attempt.skill === 'writing' 
        ? attempt.teacherFinalWritingScore?.bands.overallBand
        : attempt.teacherFinalBand
      label = band !== undefined && band !== null ? `Band ${band.toFixed(1)}` : 'Reviewed'
      
      if (band !== undefined && band !== null) {
        if (band >= 7.0) color = '#10B981'
        else if (band >= 5.5) color = '#F59E0B'
        else color = '#F43F5E'
      } else {
        color = '#10B981'
      }
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ textTransform: 'capitalize', color: '#64748B' }}>{skill}</span>
      <span style={{ color, fontWeight: 600 }}>{label}</span>
    </div>
  )
}

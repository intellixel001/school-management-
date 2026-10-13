'use client'

import { useMemo } from 'react'
import { SectionAccordion } from './SectionAccordion'
import { overallMockBand } from '@/lib/scoring/ieltsBands'
import type { MockExam, MockSectionAttempt } from '@/types/platform'

interface Props {
  mock: MockExam
  attempts: MockSectionAttempt[]
  viewMode: 'student' | 'teacher'
}

export function MockResultsView({ mock, attempts, viewMode }: Props) {
  const reading = useMemo(() => attempts.find(a => a.skill === 'reading'), [attempts])
  const listening = useMemo(() => attempts.find(a => a.skill === 'listening'), [attempts])
  const writing = useMemo(() => attempts.find(a => a.skill === 'writing'), [attempts])

  const overall = overallMockBand({
    reading: reading?.status === 'reviewed' ? reading.teacherFinalBand ?? null : null,
    listening: listening?.status === 'reviewed' ? listening.teacherFinalBand ?? null : null,
    writing: writing?.status === 'reviewed' ? (writing.teacherFinalWritingScore?.bands.overallBand ?? null) : null,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{
        background: '#FFFFFF', borderRadius: 16, padding: '24px 28px',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 0 0 1px rgba(99,102,241,0.10)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 4 }}>
          {mock.title}
        </div>
        <div style={{
          fontSize: 36, fontWeight: 800, color: '#0F172A',
          fontFamily: 'var(--font-display)', lineHeight: 1,
        }}>
          {overall !== null ? `Overall Band ${overall.toFixed(1)}` : 'Pending review'}
        </div>

        {/* Section band strip */}
        <div className="grid grid-cols-3" style={{ gap: 12, marginTop: 20 }}>
          {[
            { label: 'Reading',   attempt: reading,   skill: 'reading' as const },
            { label: 'Listening', attempt: listening, skill: 'listening' as const },
            { label: 'Writing',   attempt: writing,   skill: 'writing' as const },
          ].map(({ label, attempt, skill }) => {
            const band = bandForAttempt(attempt)
            return (
              <div key={skill} style={{
                padding: '14px 16px', borderRadius: 12,
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.14)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  {label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
                  {band !== null ? band.toFixed(1) : '—'}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  {statusLabel(attempt)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Per-section accordions */}
      {reading && mock.reading && (
        <SectionAccordion
          skill="reading"
          attempt={reading}
          test={mock.reading}
          viewMode={viewMode}
        />
      )}
      {listening && mock.listening && (
        <SectionAccordion
          skill="listening"
          attempt={listening}
          test={mock.listening}
          viewMode={viewMode}
        />
      )}
      {writing && mock.writing && (
        <SectionAccordion
          skill="writing"
          attempt={writing}
          test={mock.writing}
          viewMode={viewMode}
        />
      )}
    </div>
  )
}

function bandForAttempt(a?: MockSectionAttempt): number | null {
  if (!a || a.status !== 'reviewed') return null
  if (a.skill === 'writing') return a.teacherFinalWritingScore?.bands.overallBand ?? null
  return a.teacherFinalBand
}

function statusLabel(a?: MockSectionAttempt): string {
  if (!a) return 'Not attempted'
  if (a.status === 'reviewed') return 'Reviewed'
  if (a.status === 'submitted' || a.status === 'ai-graded') return 'Awaiting teacher review'
  return 'In progress'
}

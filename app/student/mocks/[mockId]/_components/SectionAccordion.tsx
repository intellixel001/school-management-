'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { QuestionTable } from './QuestionTable'
import { WritingResultPanel } from './WritingResultPanel'
import type { MockSectionAttempt, MockReadingTest, MockListeningTest, MockWritingTest } from '@/types/platform'

interface Props {
  skill: 'reading' | 'listening' | 'writing'
  attempt: MockSectionAttempt
  test: MockReadingTest | MockListeningTest | MockWritingTest
  viewMode: 'student' | 'teacher'
}

export function SectionAccordion({ skill, attempt, test, viewMode }: Props) {
  const [open, setOpen] = useState(true)  // default expanded

  const skillLabel = skill.charAt(0).toUpperCase() + skill.slice(1)
  const band = attempt.teacherFinalBand ?? attempt.ieltsBand ??
    attempt.teacherFinalWritingScore?.bands.overallBand ?? attempt.writingAiScore?.bands.overallBand ?? null

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 0 0 1px rgba(99,102,241,0.10)',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', fontFamily: 'var(--font-display)' }}>
            {skillLabel} Section
          </div>
          <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            {band !== null ? `Band ${band.toFixed(1)}` : 'Pending'}
            {skill !== 'writing' && attempt.rawScore !== null && attempt.totalQuestions ? (
              <> · {attempt.rawScore} / {attempt.totalQuestions} correct</>
            ) : null}
          </div>
        </div>
        {open ? <ChevronUp size={20} color="#64748B" /> : <ChevronDown size={20} color="#64748B" />}
      </button>

      {open && (
        <div style={{ padding: '0 24px 24px', borderTop: '1px solid #F1F5F9' }}>
          {skill === 'writing' ? (
            <WritingResultPanel
              attempt={attempt}
              test={test as MockWritingTest}
              viewMode={viewMode}
            />
          ) : (
            <QuestionTable
              skill={skill}
              attempt={attempt}
              test={test as MockReadingTest | MockListeningTest}
              viewMode={viewMode}
            />
          )}
        </div>
      )}
    </div>
  )
}

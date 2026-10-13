'use client'

import type { MockSectionAttempt, MockWritingTest } from '@/types/platform'

interface Props {
  attempt: MockSectionAttempt
  test: MockWritingTest
  viewMode: 'student' | 'teacher'
}

export function WritingResultPanel({ attempt, test, viewMode }: Props) {
  const score = attempt.teacherFinalWritingScore ?? attempt.writingAiScore
  if (!score) {
    return (
      <div style={{ paddingTop: 16, color: '#64748B', fontSize: 14 }}>
        Awaiting AI evaluation.
      </div>
    )
  }

  return (
    <div style={{ paddingTop: 16 }}>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
        Prompt: <em style={{ color: '#0F172A', fontStyle: 'normal' }}>{test.prompt}</em>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 10, marginBottom: 16 }}>
        {[
          { label: 'TR',  value: score.bands.taskResponse,      desc: 'Task Response' },
          { label: 'CC',  value: score.bands.coherenceCohesion, desc: 'Cohesion' },
          { label: 'LR',  value: score.bands.lexicalResource,   desc: 'Lexical' },
          { label: 'GRA', value: score.bands.grammaticalRange,  desc: 'Grammar' },
        ].map(b => (
          <div key={b.label} style={{
            padding: '12px 14px', borderRadius: 10,
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.14)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', letterSpacing: '0.6px' }}>{b.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', fontFamily: 'var(--font-mono)' }}>
              {b.value.toFixed(1)}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{b.desc}</div>
          </div>
        ))}
      </div>

      <div style={{
        padding: '14px 16px', borderRadius: 12,
        background: 'rgba(99,102,241,0.04)',
        border: '1px solid rgba(99,102,241,0.10)',
      }}>
        <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>AI feedback</div>
        <div style={{ fontSize: 14, color: '#1E293B', lineHeight: 1.55 }}>
          {score.feedback}
        </div>
      </div>

      {viewMode === 'teacher' && (
        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontSize: 12, color: '#64748B', fontWeight: 600 }}>
            View student's essay
          </summary>
          <pre style={{
            marginTop: 8, padding: 14, borderRadius: 10,
            background: '#F8FAFC', fontSize: 13, color: '#1E293B',
            whiteSpace: 'pre-wrap', fontFamily: 'var(--font-body)',
          }}>
            {(attempt.answers.essay as string) ?? ''}
          </pre>
        </details>
      )}
    </div>
  )
}

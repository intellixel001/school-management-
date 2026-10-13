'use client'

import { useState, useMemo, useEffect } from 'react'
import { Section } from './Section'
import type { MockWritingTest, MockSectionAttempt, MockWritingScore } from '@/types/platform'
import { writingBandsToOverall } from '@/lib/scoring/ieltsBands'

interface WritingReviewDetailProps {
  writing: MockWritingTest
  attempt: MockSectionAttempt
  onScoreChange?: (score: MockWritingScore) => void
  teacherFeedback?: string
  onFeedbackChange?: (text: string) => void
}

function BandEditor({ label, aiValue, currentValue, onChange, reasoning, readOnly }: { label: string, aiValue: number, currentValue: number, onChange: (val: number) => void, reasoning?: string, readOnly?: boolean }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(15,23,42,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>AI: <strong>{aiValue.toFixed(1)}</strong></span>
          {readOnly ? (
            <span style={{ fontSize: 18, fontWeight: 700, color: '#D97706' }}>{currentValue.toFixed(1)}</span>
          ) : (
            <input
              type="number"
              min={0}
              max={9}
              step={0.5}
              value={currentValue}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                if (!isNaN(val)) onChange(Math.max(0, Math.min(9, val)))
              }}
              style={{
                width: 80,
                padding: '8px 12px',
                fontSize: 18,
                fontWeight: 700,
                textAlign: 'center',
                border: '2px solid #4F46E5',
                borderRadius: 8,
                color: '#4F46E5',
              }}
            />
          )}
        </div>
      </div>
      {reasoning && (
        <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4, fontStyle: 'italic' }}>
          {reasoning}
        </div>
      )}
    </div>
  )
}

function FlagEditor({ label, set, onChange, aiSet, isAuto, readOnly }: { label: string, set: boolean, onChange: (val: boolean) => void, aiSet: boolean, isAuto: boolean, readOnly?: boolean }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', cursor: isAuto || readOnly ? 'default' : 'pointer' }}>
      <input
        type="checkbox"
        checked={set}
        onChange={(e) => onChange(e.target.checked)}
        disabled={isAuto || readOnly}
      />
      <span style={{ color: set ? '#DC2626' : '#6B7280' }}>{label}</span>
      {isAuto && <span style={{ fontSize: 12, color: '#6B7280' }}>(auto)</span>}
      {!isAuto && set !== aiSet && <span style={{ fontSize: 12, color: '#D97706' }}>(overridden)</span>}
    </label>
  )
}

export function WritingReviewDetail({ writing, attempt, onScoreChange, teacherFeedback, onFeedbackChange }: WritingReviewDetailProps) {
  const score = attempt.writingAiScore
  if (!score) {
    return (
      <div style={{ padding: 24, background: '#FEF3C7', borderRadius: 8, color: '#92400E' }}>
        Writing submission has not yet been AI-graded. Status: {attempt.status}.
      </div>
    )
  }

  const ai = score
  const isReadOnly = attempt.status === 'reviewed'
  const sourceScore = attempt.teacherFinalWritingScore ?? ai

  const [bands, setBands] = useState({
    taskResponse: sourceScore.bands.taskResponse,
    coherenceCohesion: sourceScore.bands.coherenceCohesion,
    lexicalResource: sourceScore.bands.lexicalResource,
    grammaticalRange: sourceScore.bands.grammaticalRange,
  })

  const [flags, setFlags] = useState({
    underlength: sourceScore.flags.underlength,
    offTopic: sourceScore.flags.offTopic,
    memorised: sourceScore.flags.memorised,
  })

  const overallBand = useMemo(() => writingBandsToOverall(bands), [bands])

  useEffect(() => {
    if (onScoreChange) {
      onScoreChange({
        bands: { ...bands, overallBand },
        flags,
        wordCount: ai.wordCount,
        feedback: ai.feedback,
        bandReasoning: ai.bandReasoning,
      })
    }
  }, [bands, flags, overallBand, ai, onScoreChange])

  const essayText = typeof attempt.answers.essay === 'string' ? attempt.answers.essay : ''

  return (
    <div>
      <Section title="AI Provisional Score / Overrides">
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#111827' }}>
          Overall Band: <span style={{ color: '#D97706' }}>{overallBand.toFixed(1)}</span>
        </div>

        <BandEditor
          label="Task Response (TR)"
          aiValue={ai.bands.taskResponse}
          currentValue={bands.taskResponse}
          onChange={(val) => setBands(p => ({ ...p, taskResponse: val }))}
          reasoning={ai.bandReasoning?.taskResponse}
          readOnly={isReadOnly}
        />
        <BandEditor
          label="Coherence & Cohesion (CC)"
          aiValue={ai.bands.coherenceCohesion}
          currentValue={bands.coherenceCohesion}
          onChange={(val) => setBands(p => ({ ...p, coherenceCohesion: val }))}
          reasoning={ai.bandReasoning?.coherenceCohesion}
          readOnly={isReadOnly}
        />
        <BandEditor
          label="Lexical Resource (LR)"
          aiValue={ai.bands.lexicalResource}
          currentValue={bands.lexicalResource}
          onChange={(val) => setBands(p => ({ ...p, lexicalResource: val }))}
          reasoning={ai.bandReasoning?.lexicalResource}
          readOnly={isReadOnly}
        />
        <BandEditor
          label="Grammatical Range & Acc. (GRA)"
          aiValue={ai.bands.grammaticalRange}
          currentValue={bands.grammaticalRange}
          onChange={(val) => setBands(p => ({ ...p, grammaticalRange: val }))}
          reasoning={ai.bandReasoning?.grammaticalRange}
          readOnly={isReadOnly}
        />
      </Section>

      <Section title="Flags">
        <FlagEditor
          label="UNDERLENGTH"
          aiSet={ai.flags.underlength}
          set={flags.underlength}
          onChange={(val) => setFlags(p => ({ ...p, underlength: val }))}
          isAuto={true}
          readOnly={isReadOnly}
        />
        <FlagEditor
          label="OFF-TOPIC"
          aiSet={ai.flags.offTopic}
          set={flags.offTopic}
          onChange={(val) => setFlags(p => ({ ...p, offTopic: val }))}
          isAuto={false}
          readOnly={isReadOnly}
        />
        <FlagEditor
          label="MEMORISED"
          aiSet={ai.flags.memorised}
          set={flags.memorised}
          onChange={(val) => setFlags(p => ({ ...p, memorised: val }))}
          isAuto={false}
          readOnly={isReadOnly}
        />
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(15,23,42,0.06)', fontSize: 14, color: '#6B7280' }}>
          Word count: <strong style={{ color: '#374151' }}>{ai.wordCount}</strong> · Minimum: {writing.minWords}
        </div>
      </Section>

      <Section title="AI Feedback">
        <p style={{ lineHeight: 1.7, color: '#374151', margin: 0 }}>{ai.feedback}</p>
      </Section>

      <Section title="Prompt" collapsible defaultCollapsed>
        <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#111827' }}>{writing.prompt}</h4>
        <p style={{ lineHeight: 1.6, color: '#374151', marginBottom: 12 }}>{writing.promptDescription}</p>
        <div style={{ background: '#FAFAFA', padding: 12, borderRadius: 8 }}>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0, marginBottom: 4 }}>{writing.instructions}</p>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0, fontWeight: 500 }}>Minimum {writing.minWords} words</p>
        </div>
      </Section>

      <Section title="Student's Essay">
        <div style={{
          padding: 24,
          background: '#FAFAFA',
          border: '1px solid rgba(15, 23, 42, 0.06)',
          borderRadius: 12,
          whiteSpace: 'pre-wrap',
          lineHeight: 1.8,
          fontSize: 16,
          color: '#111827',
          fontFamily: 'var(--font-body, system-ui, sans-serif)',
        }}>
          {essayText || <em style={{ color: '#9CA3AF' }}>(empty submission)</em>}
        </div>
      </Section>

      {onFeedbackChange && teacherFeedback !== undefined && attempt.status !== 'reviewed' && (
        <Section title="Personalised feedback for the student">
          <textarea
            value={teacherFeedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            maxLength={2000}
            placeholder="Write a personalised note for this student — what they did well, what to focus on next time. Visible to them when you publish."
            rows={6}
            style={{
              width: '100%',
              padding: 16,
              fontSize: 15,
              lineHeight: 1.6,
              border: '1px solid rgba(15, 23, 42, 0.1)',
              borderRadius: 8,
              resize: 'vertical',
            }}
          />
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'right' }}>
            {teacherFeedback.length} / 2000
          </div>
        </Section>
      )}

      {attempt.status === 'reviewed' && attempt.teacherFeedback && (
        <Section title="Personalised feedback for the student">
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#374151' }}>
            {attempt.teacherFeedback}
          </div>
        </Section>
      )}
    </div>
  )
}

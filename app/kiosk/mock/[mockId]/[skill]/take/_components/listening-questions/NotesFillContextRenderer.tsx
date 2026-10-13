'use client'

import type { MockListeningFormContext, MockListeningQuestion } from '@/types/platform'
import { INPUT_LIMITS } from '@/lib/security/inputLimits'

interface Props {
  context: MockListeningFormContext
  questions: MockListeningQuestion[]
  answers: Record<string, string | string[]>
  displayNumbers: Map<string, string>
  onChange: (questionId: string, value: string) => void
}

export default function NotesFillContextRenderer({ context, questions, answers, displayNumbers, onChange }: Props) {
  const questionMap = new Map(questions.map(q => [q.id, q]))

  function renderBlank(questionId: string) {
    const q = questionMap.get(questionId)
    if (!q) return null
    const value = typeof answers[q.id] === 'string' ? (answers[q.id] as string) : ''
    const label = displayNumbers.get(q.id) ?? ''
    const ariaNumber = questions.findIndex(qq => qq.id === q.id) + 1

    return (
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, verticalAlign: 'baseline' }}>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 700, color: '#7C3AED' }}>
          {label}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(q.id, e.target.value.slice(0, 60))}
          maxLength={INPUT_LIMITS.PRACTICE_OPEN_ANSWER}
          placeholder="..."
          aria-label={q.label || q.question || `Question ${ariaNumber}`}
          style={{
            display: 'inline-block',
            minWidth: 200,
            padding: '8px 15px',
            border: '1.5px solid rgba(15, 23, 42, 0.15)',
            borderRadius: 10,
            background: '#FFFFFF',
            fontSize: 20,
            color: '#1F2937',
            outline: 'none',
            margin: '0 4px',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#7C3AED' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.15)' }}
        />
      </span>
    )
  }

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid rgba(15, 23, 42, 0.08)',
      borderRadius: 20,
      padding: 40,
      marginBottom: 30,
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
    }}>
      <h3 style={{
        fontSize: 25,
        fontWeight: 600,
        color: '#0F172A',
        marginBottom: 25,
        paddingBottom: 20,
        borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        fontFamily: 'var(--font-display, sans-serif)'
      }}>
        {context.title}
      </h3>

      {context.format === 'form' ? (
        <FormLayout context={context} renderBlank={renderBlank} />
      ) : (
        <BulletListLayout context={context} renderBlank={renderBlank} />
      )}
    </div>
  )
}

function FormLayout({ context, renderBlank }: { context: MockListeningFormContext; renderBlank: (id: string) => React.ReactNode }) {
  return (
    <div style={{ fontSize: 20, lineHeight: 2.2, color: '#1F2937', fontFamily: 'var(--font-body, sans-serif)' }}>
      {context.elements.map((el, idx) => {
        if (el.type === 'heading') {
          return (
            <div key={idx} style={{ marginTop: 30, marginBottom: 15, fontWeight: 600, fontSize: 21, color: '#0F172A' }}>
              {el.text}
            </div>
          )
        }
        if (el.type === 'label') {
          return <span key={idx} style={{ marginRight: 4 }}>{el.text}</span>
        }
        if (el.type === 'blank') {
          return <span key={idx} style={{ marginRight: 4 }}>{renderBlank(el.questionId)}</span>
        }
        return null
      })}
    </div>
  )
}

function BulletListLayout({ context, renderBlank }: { context: MockListeningFormContext; renderBlank: (id: string) => React.ReactNode }) {
  const groups: Array<{ heading: string; bullets: Array<React.ReactNode> }> = []
  let currentGroup: { heading: string; bullets: Array<React.ReactNode> } | null = null
  let currentBullet: React.ReactNode[] = []

  context.elements.forEach((el, idx) => {
    if (el.type === 'heading') {
      if (currentGroup && currentBullet.length > 0) {
        currentGroup.bullets.push(<span key={`b-${idx}`}>{currentBullet}</span>)
        currentBullet = []
      }
      currentGroup = { heading: el.text, bullets: [] }
      groups.push(currentGroup)
    } else if (el.type === 'label') {
      // Very simple heuristic: if it looks like a bullet point starter in text
      if (el.text && (el.text.trim().startsWith('•') || el.text.trim().startsWith('-'))) {
        if (currentBullet.length > 0 && currentGroup) {
          currentGroup.bullets.push(<span key={`b-split-${idx}`}>{currentBullet}</span>)
          currentBullet = []
        }
      }
      currentBullet.push(<span key={idx} style={{ marginRight: 4 }}>{el.text}</span>)
    } else if (el.type === 'blank') {
      currentBullet.push(<span key={idx} style={{ marginRight: 4 }}>{renderBlank(el.questionId)}</span>)
    }
  })

  if (currentGroup && currentBullet.length > 0) {
    (currentGroup as { heading: string; bullets: Array<React.ReactNode> }).bullets.push(<span key="last">{currentBullet}</span>)
  }

  // If there's no heading at all, wrap everything in one default group
  if (groups.length === 0 && currentBullet.length > 0) {
    groups.push({ heading: '', bullets: [<span key="only">{currentBullet}</span>] })
  }

  return (
    <div style={{ fontSize: 20, lineHeight: 2.0, color: '#1F2937', fontFamily: 'var(--font-body, sans-serif)' }}>
      {groups.map((g, idx) => (
        <div key={idx} style={{ marginBottom: 30 }}>
          {g.heading && (
            <div style={{ fontWeight: 600, fontSize: 21, color: '#0F172A', marginBottom: 15 }}>{g.heading}</div>
          )}
          <ul style={{ listStyle: 'disc', paddingLeft: 30, margin: 0, display: 'flex', flexDirection: 'column', gap: 15 }}>
            {g.bullets.map((b, bIdx) => <li key={bIdx}>{b}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}

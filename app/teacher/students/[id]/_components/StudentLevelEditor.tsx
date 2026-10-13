'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X, Pencil } from 'lucide-react'
import { updateStudentLevel } from '@/lib/services'
import { LEVEL_ORDER, LEVEL_LABEL, LEVEL_SHORT } from '@/lib/levelConfig'
import type { SkillLevel } from '@/types/platform'

interface Props {
  studentId: string
  currentLevel: SkillLevel
}

export function StudentLevelEditor({ studentId, currentLevel }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState<SkillLevel>(currentLevel)
  const [error, setError]     = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const dirty = draft !== currentLevel

  function openEditor() {
    setDraft(currentLevel)
    setError(null)
    setEditing(true)
  }

  function cancel() {
    setDraft(currentLevel)
    setError(null)
    setEditing(false)
  }

  function confirm() {
    if (!dirty) { setEditing(false); return }
    setError(null)
    startTransition(async () => {
      try {
        await updateStudentLevel(studentId, draft)
        setEditing(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update level')
      }
    })
  }

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 14px',
          background: 'rgba(255,255,255,0.10)',
          border: '1px solid rgba(255,255,255,0.22)',
          borderRadius: 10,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>
          <span style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '1px',
            textTransform: 'uppercase', color: '#CBD5E1',
          }}>
            Level
          </span>
          <span style={{
            fontSize: 14, fontWeight: 800, color: '#FFFFFF',
            fontFamily: 'var(--font-body)',
            padding: '2px 8px',
            background: 'rgba(77,159,255,0.28)',
            border: '1px solid rgba(77,159,255,0.55)',
            borderRadius: 6,
            letterSpacing: '0.3px',
          }}>
            {LEVEL_SHORT[currentLevel]}
          </span>
        </div>
        <button
          type="button"
          onClick={openEditor}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            fontSize: 13, fontWeight: 700,
            color: '#FFFFFF',
            background: 'linear-gradient(180deg, #4D9FFF 0%, #2E7DD8 100%)',
            border: '1px solid rgba(77,159,255,0.75)',
            borderRadius: 9, padding: '8px 14px',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            boxShadow: '0 4px 14px rgba(77,159,255,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          <Pencil size={13} />
          Change level
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 8px',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.20)',
        borderRadius: 12,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      }}>
        <label style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '1px',
          textTransform: 'uppercase', color: '#CBD5E1',
          paddingLeft: 6,
        }}>
          Level
        </label>
        <select
          value={draft}
          onChange={e => setDraft(e.target.value as SkillLevel)}
          disabled={pending}
          style={{
            fontSize: 13, fontWeight: 700,
            color: '#FFFFFF',
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.30)',
            borderRadius: 8, padding: '7px 12px',
            fontFamily: 'var(--font-body)',
            cursor: pending ? 'not-allowed' : 'pointer',
            outline: 'none',
          }}
        >
          {LEVEL_ORDER.map(lv => (
            <option key={lv} value={lv} style={{ background: '#0E2444', color: '#F1F5F9' }}>
              {LEVEL_LABEL[lv]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={confirm}
          disabled={pending || !dirty}
          title={dirty ? 'Confirm' : 'No changes'}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34,
            color: '#FFFFFF',
            background: dirty
              ? 'linear-gradient(180deg, #10B981 0%, #059669 100%)'
              : 'rgba(16,185,129,0.20)',
            border: `1px solid ${dirty ? 'rgba(16,185,129,0.85)' : 'rgba(16,185,129,0.35)'}`,
            borderRadius: 8,
            cursor: pending || !dirty ? 'not-allowed' : 'pointer',
            opacity: !dirty ? 0.55 : 1,
            boxShadow: dirty ? '0 3px 10px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.18)' : 'none',
          }}
        >
          <Check size={16} strokeWidth={2.75} />
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={pending}
          title="Cancel"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34,
            color: '#FFFFFF',
            background: 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)',
            border: '1px solid rgba(239,68,68,0.85)',
            borderRadius: 8,
            cursor: pending ? 'not-allowed' : 'pointer',
            boxShadow: '0 3px 10px rgba(239,68,68,0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          <X size={16} strokeWidth={2.75} />
        </button>
      </div>
      {error && (
        <div style={{
          fontSize: 11, color: '#F87171',
          background: 'rgba(248,113,113,0.10)',
          border: '1px solid rgba(248,113,113,0.24)',
          borderRadius: 6, padding: '3px 8px',
        }}>
          {error}
        </div>
      )}
      {pending && !error && (
        <div style={{ fontSize: 11, color: '#94A3B8' }}>Saving…</div>
      )}
    </div>
  )
}

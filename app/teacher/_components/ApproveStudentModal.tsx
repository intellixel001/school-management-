import { useState } from 'react'
import { approveStudent, rejectStudent } from '@/lib/services'
import { LEVEL_ORDER, LEVEL_LABEL } from '@/lib/levelConfig'
import type { Student, SkillLevel } from '@/types/platform'

interface ApproveStudentModalProps {
  student: Student
  isOpen: boolean
  onClose: () => void
  onApproved: (updated: Student) => void
  onRejected?: () => void
}

const LEVEL_COLORS: Record<SkillLevel, string> = {
  'entry-1': '#64748B',
  'entry-2': '#D97706',
  'entry-3': '#4D9FFF',
  'level-1': '#10B981',
}

export default function ApproveStudentModal({
  student,
  isOpen,
  onClose,
  onApproved,
  onRejected,
}: ApproveStudentModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel | null>(null)
  const [loading, setLoading] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleApprove() {
    if (!selectedLevel) return
    setLoading(true)
    setError(null)
    try {
      const updated = await approveStudent(student.id, selectedLevel)
      onApproved(updated)
    } catch {
      setError('Could not approve — please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReject() {
    if (!confirm(`Are you sure you want to reject and completely delete ${student.name}'s account?`)) {
      return
    }
    setRejecting(true)
    setError(null)
    try {
      await rejectStudent(student.id)
      if (onRejected) onRejected()
      onClose()
    } catch {
      setError('Could not reject — please try again.')
    } finally {
      setRejecting(false)
    }
  }


  function handleClose() {
    if (loading) return
    setSelectedLevel(null)
    setError(null)
    onClose()
  }

  return (
    /* Backdrop */
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      {/* Modal card — stop click propagation */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 18,
          padding: '28px 30px',
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 24px 80px rgba(0,0,0,0.40)',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        {/* Header */}
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#F59E0B',
            textTransform: 'uppercase', letterSpacing: '1px',
            marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', boxShadow: '0 0 6px #F59E0B' }} />
            Teacher Action
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
            Approve {student.name}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '5px 0 0', fontFamily: 'monospace' }}>
            {student.email}
          </p>
        </div>

        {/* Level selector */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Set initial level:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {LEVEL_ORDER.map(level => {
              const isSelected = selectedLevel === level
              const color = LEVEL_COLORS[level]
              return (
                <button
                  key={level}
                  disabled={loading}
                  onClick={() => setSelectedLevel(level)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: `2px solid ${isSelected ? color : 'var(--border-default)'}`,
                    background: isSelected ? `${color}14` : 'var(--bg-surface-2)',
                    color: isSelected ? color : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 120ms ease, background 120ms ease, color 120ms ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 800 }}>
                    {level === 'entry-1' ? 'E1' : level === 'entry-2' ? 'E2' : level === 'entry-3' ? 'E3' : 'L1'}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: isSelected ? color : 'var(--text-muted)' }}>
                    {LEVEL_LABEL[level]}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Notice */}
        <p style={{
          fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6,
          padding: '10px 14px',
          background: 'var(--bg-surface-2)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
        }}>
          Approving will activate this student. You can adjust their level later from their detail page.
        </p>

        {/* Error */}
        {error && (
          <p style={{ fontSize: 12, color: '#EF4444', margin: 0, textAlign: 'center' }}>
            {error}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            disabled={loading || rejecting}
            onClick={handleReject}
            style={{
              padding: '9px 16px',
              borderRadius: 9,
              border: '1px solid rgba(239,68,68,0.35)',
              background: 'rgba(239,68,68,0.10)',
              color: '#EF4444',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading || rejecting ? 'not-allowed' : 'pointer',
              opacity: loading || rejecting ? 0.5 : 1,
              transition: 'background 150ms ease',
            }}
            onMouseEnter={e => {
              if (!loading && !rejecting) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.20)'
            }}
            onMouseLeave={e => {
              if (!loading && !rejecting) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.10)'
            }}
          >
            {rejecting ? 'Rejecting…' : 'Reject Application'}
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              disabled={loading || rejecting}
              onClick={handleClose}
              style={{
                padding: '9px 20px',
                borderRadius: 9,
                border: '1px solid var(--border-default)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600,
                cursor: loading || rejecting ? 'not-allowed' : 'pointer',
                opacity: loading || rejecting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              disabled={!selectedLevel || loading || rejecting}
              onClick={handleApprove}
              style={{
                padding: '9px 22px',
                borderRadius: 9,
                border: 'none',
                background: selectedLevel && !loading && !rejecting
                  ? `linear-gradient(135deg, ${LEVEL_COLORS[selectedLevel]} 0%, ${LEVEL_COLORS[selectedLevel]}CC 100%)`
                  : 'var(--bg-surface-3)',
                color: selectedLevel && !loading && !rejecting ? '#FFFFFF' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 700,
                cursor: !selectedLevel || loading || rejecting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'background 200ms ease, color 200ms ease',
                boxShadow: selectedLevel && !loading && !rejecting ? '0 4px 14px rgba(0,0,0,0.20)' : 'none',
              }}
            >
              {loading ? (
                <>
                  {/* Minimal CSS spinner */}
                  <span style={{
                    width: 13, height: 13, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#FFFFFF',
                    animation: 'spin 0.7s linear infinite',
                    flexShrink: 0,
                  }} />
                  Approving…
                </>
              ) : (
                'Approve'
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Spinner keyframe (inline style injection via global style tag trick) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

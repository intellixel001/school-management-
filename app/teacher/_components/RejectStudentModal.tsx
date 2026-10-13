'use client'

import { useState } from 'react'
import { rejectStudent } from '@/lib/services'
import { AlertTriangle } from 'lucide-react'
import type { Student } from '@/types/platform'

interface RejectStudentModalProps {
  student: Student
  isOpen: boolean
  onClose: () => void
  onRejected: (studentId: string) => void
}

const RED = '#EF4444'

export default function RejectStudentModal({
  student,
  isOpen,
  onClose,
  onRejected,
}: RejectStudentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleReject() {
    setLoading(true)
    setError(null)
    try {
      await rejectStudent(student.id)
      onRejected(student.id)
    } catch {
      setError('Could not reject — please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (loading) return
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
      <div
        onClick={e => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reject-title"
        style={{
          background: 'var(--bg-surface)',
          border: `1px solid rgba(239,68,68,0.40)`,
          borderRadius: 18,
          padding: '28px 30px',
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Header */}
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: RED,
            textTransform: 'uppercase', letterSpacing: '1px',
            marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <AlertTriangle size={13} />
            Permanent action
          </div>
          <h2
            id="reject-title"
            style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}
          >
            Reject {student.name}?
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '5px 0 0', fontFamily: 'monospace' }}>
            {student.email}
          </p>
        </div>

        {/* Warning — spells out exactly what is destroyed */}
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.28)',
          borderRadius: 10,
          padding: '14px 16px',
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 10px', fontWeight: 600 }}>
            This cannot be undone. Rejecting will permanently:
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              'Delete this account and all of its data from the database',
              'Invalidate the PIN that was emailed to this student',
              'Free up the email address so it can register again',
            ].map(line => (
              <li key={line} style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
          If you only want to hold off for now, close this dialog — the account stays
          pending and unusable until you approve it.
        </p>

        {/* Error */}
        {error && (
          <p style={{ fontSize: 12, color: RED, margin: 0, textAlign: 'center' }}>
            {error}
          </p>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            disabled={loading}
            onClick={handleClose}
            style={{
              padding: '9px 20px',
              borderRadius: 9,
              border: '1px solid var(--border-default)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={handleReject}
            style={{
              padding: '9px 22px',
              borderRadius: 9,
              border: 'none',
              background: loading ? 'var(--bg-surface-3)' : `linear-gradient(135deg, ${RED} 0%, #DC2626 100%)`,
              color: loading ? 'var(--text-muted)' : '#FFFFFF',
              fontSize: 13, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
              boxShadow: loading ? 'none' : '0 4px 14px rgba(239,68,68,0.30)',
              transition: 'background 200ms ease, color 200ms ease',
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 13, height: 13, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#FFFFFF',
                  animation: 'spin 0.7s linear infinite',
                  flexShrink: 0,
                }} />
                Rejecting…
              </>
            ) : (
              'Reject & delete account'
            )}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

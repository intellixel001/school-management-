'use client'

import { useEffect, useMemo, useState } from 'react'
import { getStudents } from '@/lib/services'
import { formatDate } from '@/lib/utils/time'
import { TeacherPageHero } from '../_components/TeacherPageHero'
import ApproveStudentModal from '../_components/ApproveStudentModal'
import RejectStudentModal from '../_components/RejectStudentModal'
import { Spinner } from '@/components/ui'
import { UserCheck, Search } from 'lucide-react'
import type { Student } from '@/types/platform'

// ── Design tokens (match the rest of the teacher portal) ─────────────────────

const AMBER = '#F59E0B'
const GREEN = '#10B981'

function initialsOf(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

/** Registration date, or a note when the backend hasn't set one yet. */
function registeredLabel(s: Student): string {
  if (!s.enrolledDate) return 'Registration date not recorded'
  return `Registered ${formatDate(s.enrolledDate, 'long')}`
}

export default function ApprovalsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [openFor, setOpenFor] = useState<Student | null>(null)
  const [rejectFor, setRejectFor] = useState<Student | null>(null)

  async function load() {
    try {
      const all = await getStudents()
      setStudents(all)
      setLoadFailed(false)
    } catch {
      setLoadFailed(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  // Only pending accounts live on this page — the Students page lists everyone
  // who has already been approved.
  const pending = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students
      .filter(s => s.status === 'pending')
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q))
      .sort((a, b) => {
        const aD = a.enrolledDate ? new Date(a.enrolledDate).getTime() : 0
        const bD = b.enrolledDate ? new Date(b.enrolledDate).getTime() : 0
        if (aD !== bD) return bD - aD
        return a.name.localeCompare(b.name)
      })
  }, [students, query])

  const pendingTotal = students.filter(s => s.status === 'pending').length

  // ── Loading / error ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
        <Spinner />
      </div>
    )
  }

  if (loadFailed) {
    return (
      <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.28)',
          borderRadius: 14, padding: '28px 30px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#F87171', marginBottom: 6 }}>
            Approvals unavailable
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
            We couldn&apos;t load the student list. Please try again.
          </p>
          <button
            onClick={() => { setIsLoading(true); void load() }}
            style={{
              padding: '9px 20px', borderRadius: 9, border: '1px solid var(--border-default)',
              background: 'transparent', color: 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  // ── Page ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      <TeacherPageHero
        eyebrow="Account Approvals"
        title="Approve Students"
        subtitle={
          pendingTotal === 0
            ? 'No accounts are waiting for approval'
            : `${pendingTotal} account${pendingTotal !== 1 ? 's' : ''} waiting for your approval`
        }
        rightSlot={
          <div style={{ background: 'rgba(245,158,11,0.12)', borderRadius: 10, padding: '8px 18px', border: '1px solid rgba(245,158,11,0.22)', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: AMBER, fontFamily: 'monospace', lineHeight: 1 }}>{pendingTotal}</div>
            <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>Pending</div>
          </div>
        }
      />

      {/* ── Explainer ──────────────────────────────────────────────────────── */}
      <p style={{
        fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6,
        padding: '12px 16px',
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 10,
      }}>
        A new account cannot be used until it is approved here. Until then the student
        can&apos;t sign in to their dashboard or use the kiosk, and they don&apos;t appear
        in your cohort. Approved students move to the Students page.
      </p>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
        />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '11px 16px 11px 40px',
            borderRadius: 10,
            border: '1px solid var(--border-default)',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: 14, outline: 'none',
          }}
        />
      </div>

      {/* ── Pending queue ──────────────────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <UserCheck size={15} style={{ color: AMBER }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: AMBER, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Awaiting approval
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: AMBER,
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.24)',
            borderRadius: 20, padding: '1px 8px',
          }}>
            {pending.length}
          </span>
        </div>

        {pending.length === 0 ? (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-default)',
            borderRadius: 14, padding: '26px 20px',
            textAlign: 'center', fontSize: 13, color: 'var(--text-muted)',
          }}>
            {pendingTotal === 0
              ? 'Nothing to approve right now. New registrations will appear here.'
              : 'No pending accounts match your search.'}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            {pending.map((student, idx) => (
              <div
                key={student.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px',
                  borderBottom: idx === pending.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-default)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '-0.5px',
                }}>
                  {initialsOf(student.name)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Name + state badge together — the badge labels the student,
                      not the button group. */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <span style={{
                      fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {student.name}
                    </span>
                    <span style={{
                      fontSize: 9.5, fontWeight: 700, color: '#8A5A0B',
                      background: 'linear-gradient(135deg, #FDF0CE 0%, #F7DFA5 100%)',
                      border: '1px solid rgba(197,143,29,0.45)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65), 0 1px 2px rgba(140,95,10,0.12)',
                      borderRadius: 5, padding: '2px 8px',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      Pending
                    </span>
                  </div>
                  <div style={{
                    fontSize: 11, color: 'var(--text-muted)', marginTop: 3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {student.email} · {registeredLabel(student)}
                  </div>
                </div>

                <button
                  onClick={() => setRejectFor(student)}
                  style={{
                    flexShrink: 0, padding: '8px 16px', borderRadius: 8,
                    border: '1px solid rgba(220,38,38,0.45)',
                    background: 'rgba(239,68,68,0.06)',
                    color: '#DC2626', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'background 150ms ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.16)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
                >
                  Reject
                </button>

                <button
                  onClick={() => setOpenFor(student)}
                  style={{
                    flexShrink: 0, padding: '8px 20px', borderRadius: 8,
                    border: 'none',
                    background: `linear-gradient(135deg, ${GREEN} 0%, #059669 100%)`,
                    color: '#FFFFFF', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: '0 2px 10px rgba(16,185,129,0.28)',
                    transition: 'filter 150ms ease, box-shadow 150ms ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.filter    = 'brightness(1.08)'
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.40)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.filter    = 'none'
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(16,185,129,0.28)'
                  }}
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Approval modal ─────────────────────────────────────────────────── */}
      {openFor && (
        <ApproveStudentModal
          student={openFor}
          isOpen={true}
          onClose={() => setOpenFor(null)}
          onApproved={(updated) => {
            setOpenFor(null)
            // Drop the row immediately, then re-read so the nav badge agrees.
            setStudents(list => list.filter(s => s.id !== updated.id))
            void load()
          }}
        />
      )}

      {/* ── Reject confirmation ────────────────────────────────────────────── */}
      {rejectFor && (
        <RejectStudentModal
          student={rejectFor}
          isOpen={true}
          onClose={() => setRejectFor(null)}
          onRejected={(studentId) => {
            setRejectFor(null)
            setStudents(list => list.filter(s => s.id !== studentId))
            void load()
          }}
        />
      )}
    </div>
  )
}

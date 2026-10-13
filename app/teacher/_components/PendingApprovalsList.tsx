'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import type { Student } from '@/types/platform'
import { rejectStudent } from '@/lib/services'
import ApproveStudentModal from './ApproveStudentModal'

interface PendingApprovalsListProps {
  students: Student[]
  onStudentUpdated?: () => void
}

export default function PendingApprovalsList({
  students: initialStudents,
  onStudentUpdated,
}: PendingApprovalsListProps) {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [openFor, setOpenFor] = useState<Student | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Sync state if prop changes
  if (initialStudents !== students && initialStudents.length !== students.length) {
    setStudents(initialStudents)
  }

  // Hidden when no pending students
  if (students.length === 0) return null

  const count = students.length

  async function handleReject(student: Student) {
    setIsDeleting(student.id)
    try {
      await rejectStudent(student.id)
      setStudents(prev => prev.filter(s => s.id !== student.id))
      setRejectingId(null)
      if (onStudentUpdated) onStudentUpdated()
      router.refresh()
    } catch {
      alert('Failed to reject student. Please try again.')
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.06) 100%)',
        border: '2px solid rgba(245,158,11,0.40)',
        boxShadow: '0 8px 24px rgba(245,158,11,0.10)',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {/* ── Alert header ─────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '2px solid rgba(245,158,11,0.25)',
          background: 'rgba(245,158,11,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            flexShrink: 0,
            background: 'rgba(245,158,11,0.16)',
            border: '1px solid rgba(245,158,11,0.30)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D97706',
          }}
        >
          <AlertTriangle size={15} />
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#D97706' }}>
            Pending Approvals
          </span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 12,
              fontWeight: 700,
              background: 'rgba(245,158,11,0.18)',
              border: '1px solid rgba(245,158,11,0.32)',
              borderRadius: 20,
              color: '#D97706',
              padding: '1px 8px',
            }}
          >
            {count}
          </span>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>
            {count === 1
              ? '1 new account is waiting to be approved before it can be used.'
              : `${count} new accounts are waiting to be approved before they can be used.`}
          </div>
        </div>

        <Link
          href="/teacher/approvals"
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 18px',
            borderRadius: 9,
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            color: '#FFFFFF',
            fontSize: 12.5,
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 10px rgba(217,119,6,0.32)',
            transition: 'filter 150ms ease, box-shadow 150ms ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.filter = 'brightness(1.08)'
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(217,119,6,0.44)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.filter = 'none'
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(217,119,6,0.32)'
          }}
        >
          Review &amp; Approve All
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* ── Student rows ─────────────────────────────────────────────────── */}
      <div style={{ padding: '4px 0' }}>
        {students.map((student, idx) => {
          const isLast = idx === students.length - 1
          const initials = student.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
          const isConfirmingReject = rejectingId === student.id
          const deletingThis = isDeleting === student.id

          return (
            <div
              key={student.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                borderBottom: isLast ? 'none' : '1px solid rgba(245,158,11,0.20)',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background:
                    'linear-gradient(135deg, rgba(245,158,11,0.28) 0%, rgba(245,158,11,0.14) 100%)',
                  border: '1px solid rgba(245,158,11,0.28)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#D97706',
                  letterSpacing: '-0.5px',
                }}
              >
                {initials}
              </div>

              {/* Name + email */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {student.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    marginTop: 1,
                  }}
                >
                  {student.email}
                </div>
              </div>

              {/* Pending chip */}
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: '#8A5A0B',
                  background: '#FFFFFF',
                  border: '1px solid rgba(180,83,9,0.28)',
                  boxShadow: '0 1px 2px rgba(120,80,10,0.10)',
                  borderRadius: 5,
                  padding: '3px 9px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Pending
              </span>

              {/* Action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {isConfirmingReject ? (
                  <>
                    <button
                      disabled={deletingThis}
                      onClick={() => handleReject(student)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid #EF4444',
                        background: '#EF4444',
                        color: '#FFFFFF',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: deletingThis ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {deletingThis ? 'Deleting…' : 'Confirm Delete'}
                    </button>
                    <button
                      disabled={deletingThis}
                      onClick={() => setRejectingId(null)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--border-default)',
                        background: 'transparent',
                        color: 'var(--text-secondary)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: deletingThis ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {/* Reject button */}
                    <button
                      onClick={() => setRejectingId(student.id)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 8,
                        border: '1px solid rgba(239,68,68,0.35)',
                        background: 'rgba(239,68,68,0.10)',
                        color: '#EF4444',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={e => {
                        ;(e.currentTarget as HTMLButtonElement).style.background =
                          'rgba(239,68,68,0.22)'
                      }}
                      onMouseLeave={e => {
                        ;(e.currentTarget as HTMLButtonElement).style.background =
                          'rgba(239,68,68,0.10)'
                      }}
                    >
                      Reject
                    </button>

                    {/* Approve button */}
                    <button
                      onClick={() => setOpenFor(student)}
                      style={{
                        padding: '7px 16px',
                        borderRadius: 8,
                        border: '1px solid rgba(245,158,11,0.40)',
                        background: 'rgba(245,158,11,0.12)',
                        color: '#F59E0B',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'background 150ms ease',
                      }}
                      onMouseEnter={e => {
                        ;(e.currentTarget as HTMLButtonElement).style.background =
                          'rgba(245,158,11,0.25)'
                      }}
                      onMouseLeave={e => {
                        ;(e.currentTarget as HTMLButtonElement).style.background =
                          'rgba(245,158,11,0.12)'
                      }}
                    >
                      Approve →
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Approval modal */}
      {openFor && (
        <ApproveStudentModal
          student={openFor}
          isOpen={true}
          onClose={() => setOpenFor(null)}
          onApproved={() => {
            setStudents(prev => prev.filter(s => s.id !== openFor.id))
            setOpenFor(null)
            if (onStudentUpdated) onStudentUpdated()
            router.refresh()
          }}
          onRejected={() => {
            setStudents(prev => prev.filter(s => s.id !== openFor.id))
            setOpenFor(null)
            if (onStudentUpdated) onStudentUpdated()
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

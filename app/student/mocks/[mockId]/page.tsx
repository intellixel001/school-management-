'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Spinner } from '@/components/ui'
import { useStudentSession } from '../../_components/StudentSessionProvider'
import { getMockExam, getStudentMockAttempts } from '@/lib/services'
import { MockResultsView } from './_components/MockResultsView'
import type { MockExam, MockSectionAttempt } from '@/types/platform'

export default function StudentMockDetailPage() {
  const params = useParams()
  const mockId = params.mockId as string
  const { session } = useStudentSession()
  const [mock, setMock] = useState<MockExam | null>(null)
  const [attempts, setAttempts] = useState<MockSectionAttempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    Promise.all([
      getMockExam(mockId),
      getStudentMockAttempts(session.studentId),
    ]).then(([m, a]) => {
      setMock(m)
      setAttempts(a.filter(att => att.mockExamId === mockId))
      setLoading(false)
    })
  }, [mockId, session])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280 }}>
        <Spinner size="lg" />
      </div>
    )
  }
  if (!mock) {
    return <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8' }}>Mock test not found</div>
  }

  return (
    <div style={{ maxWidth: 1160, width: '100%', margin: '0 auto', padding: '0 16px 40px' }}>
      <Link href="/student" style={{
        fontSize: 13, color: '#6B7280', textDecoration: 'none',
        display: 'inline-block', marginBottom: 16,
      }}>
        ← Back to Dashboard
      </Link>
      <MockResultsView mock={mock} attempts={attempts} viewMode="student" />
    </div>
  )
}

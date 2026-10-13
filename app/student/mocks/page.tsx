'use client'

import { useStudentSession } from '../_components/StudentSessionProvider'
import { MyMockTestsCard } from '../_components/MyMockTestsCard'

export default function MockExamsPage() {
  const { session } = useStudentSession()

  if (!session) return null

  return (
    <div style={{ maxWidth: 1160, width: '100%', margin: '0 auto', padding: '20px 16px 40px' }}>
      <MyMockTestsCard studentId={session.studentId} />
    </div>
  )
}

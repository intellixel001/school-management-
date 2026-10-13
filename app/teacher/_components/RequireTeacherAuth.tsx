'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTeacherSession } from './TeacherSessionProvider'
import { Spinner } from '@/components/ui'

export default function RequireTeacherAuth({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useTeacherSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!session) {
      const returnTo = encodeURIComponent(pathname)
      router.replace(`/teacher/login?return=${returnTo}`)
    }
  }, [session, isLoading, router, pathname])

  if (isLoading || !session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Spinner size="lg" />
      </div>
    )
  }

  return <>{children}</>
}

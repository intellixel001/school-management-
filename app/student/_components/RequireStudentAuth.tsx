'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useStudentSession } from './StudentSessionProvider'

// Public student routes that don't require an active session.
// Adding /student/register here so unauthenticated visitors can reach the
// registration flow without being bounced back to /student/login.
const PUBLIC_PATHS = ['/student/login', '/student/register']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export default function RequireStudentAuth({ children }: { children: React.ReactNode }) {
  const { session, isHydrated } = useStudentSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isHydrated) return
    if (!session && !isPublicPath(pathname)) {
      router.replace('/student/login')
    }
  }, [isHydrated, session, pathname, router])

  // Pre-hydration: render nothing — prevents flash of dashboard for unauthed users.
  if (!isHydrated) return null

  // Public paths (login, register): always render — no session required.
  if (isPublicPath(pathname)) return <>{children}</>

  // Post-hydration, no session: render nothing while the redirect fires.
  if (!session) return null

  // Authenticated: render children.
  return <>{children}</>
}

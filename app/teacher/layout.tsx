import type { Metadata } from 'next'
import { TeacherLayoutShell } from './_components/TeacherLayoutShell'

export const metadata: Metadata = {
  title: 'Teacher — English AI Tutor',
}

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return <TeacherLayoutShell>{children}</TeacherLayoutShell>
}

import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/admin/server'
import { AdminProvider } from '../_components/AdminProvider'
import AdminShell from '../_components/AdminShell'

export const dynamic = 'force-dynamic'
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!await isAdmin()) redirect('/admin/login')
  return <AdminProvider><AdminShell>{children}</AdminShell></AdminProvider>
}

import type { Metadata } from 'next'
import './admin.css'

export const metadata: Metadata = { title: 'Administration | English Connect', robots: { index: false, follow: false } }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-app">{children}</div>
}

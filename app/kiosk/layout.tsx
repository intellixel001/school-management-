import type { Metadata } from 'next'
import ClientKioskLayout from './client-layout'

export const metadata: Metadata = {
  title: 'Kiosk — English AI Tutor',
  description: 'English AI Tutor Kiosk — Nelson College London',
}

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return <ClientKioskLayout>{children}</ClientKioskLayout>
}

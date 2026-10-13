import type { Metadata } from 'next'
import { Outfit, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import { ApiWakeupOverlay } from '@/components/ApiWakeupOverlay'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'English AI Tutor — Nelson College London',
  description: 'AI-powered English learning platform by Truedge Digital',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`h-full ${outfit.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className="h-full antialiased" suppressHydrationWarning>
        <ApiWakeupOverlay />
        {children}
      </body>
    </html>
  )
}

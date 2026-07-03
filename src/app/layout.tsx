import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Newsreader } from 'next/font/google'
import { AuthSessionSync } from '@/components/providers/AuthSessionSync'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { OfflineBanner, ToastProvider } from '@/components/design-system'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Sankalp AEI',
    template: '%s · Sankalp AEI',
  },
  description:
    'Student learning analytics and parent engagement platform for Sankalp AEI.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sankalp AEI',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#5c3e6e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">
        <QueryProvider>
          <ToastProvider>
            <AuthSessionSync />
            <OfflineBanner />
            <div className="relative min-h-screen">{children}</div>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  )
}

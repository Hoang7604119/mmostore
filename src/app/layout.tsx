import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientWrapper from '@/components/ClientWrapper'
import { CONTACT_INFO } from '@/config/contact'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: CONTACT_INFO.COMPANY_NAME,
  description: CONTACT_INFO.COMPANY_DESCRIPTION,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/favicon.svg'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: CONTACT_INFO.COMPANY_NAME
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: CONTACT_INFO.COMPANY_NAME,
    title: CONTACT_INFO.COMPANY_NAME,
    description: CONTACT_INFO.COMPANY_DESCRIPTION
  },
  twitter: {
    card: 'summary',
    title: CONTACT_INFO.COMPANY_NAME,
    description: CONTACT_INFO.COMPANY_DESCRIPTION
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <ClientWrapper>
          <div className="min-h-screen bg-background flex flex-col">
            {children}
          </div>
        </ClientWrapper>
      </body>
    </html>
  )
}
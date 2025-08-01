import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientWrapper from '@/components/ClientWrapper'
import { CONTACT_INFO } from '@/config/contact'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: CONTACT_INFO.COMPANY_NAME,
  description: CONTACT_INFO.COMPANY_DESCRIPTION,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '152x152', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '144x144', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '120x120', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '114x114', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '76x76', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '72x72', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '60x60', type: 'image/png' },
      { url: '/apple-touch-icon.png', sizes: '57x57', type: 'image/png' }
    ],
    shortcut: '/favicon.svg',
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon.svg',
        color: '#2563eb'
      }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: CONTACT_INFO.COMPANY_NAME,
    startupImage: '/apple-touch-icon.png'
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: CONTACT_INFO.COMPANY_NAME,
    title: CONTACT_INFO.COMPANY_NAME,
    description: CONTACT_INFO.COMPANY_DESCRIPTION,
    images: ['/apple-touch-icon.png']
  },
  twitter: {
    card: 'summary',
    title: CONTACT_INFO.COMPANY_NAME,
    description: CONTACT_INFO.COMPANY_DESCRIPTION,
    images: ['/apple-touch-icon.png']
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="16x16" type="image/x-icon" />
        <link rel="icon" href="/icon-16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/icon-32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/icon-512.png" sizes="512x512" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="152x152" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="144x144" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="120x120" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="114x114" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="76x76" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="72x72" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="60x60" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="57x57" />
        <link rel="mask-icon" href="/favicon.svg" color="#2563eb" />
        <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={CONTACT_INFO.COMPANY_NAME} />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />
      </head>
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
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientWrapper from '@/components/ClientWrapper'
import { CONTACT_INFO } from '@/config/contact'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: CONTACT_INFO.COMPANY_NAME,
    template: `%s - ${CONTACT_INFO.COMPANY_NAME}`
  },
  description: CONTACT_INFO.COMPANY_DESCRIPTION,
  keywords: ['MMO Store', 'marketplace', 'mua bán online', 'game items', 'digital marketplace'],
  authors: [{ name: CONTACT_INFO.COMPANY_NAME }],
  creator: CONTACT_INFO.COMPANY_NAME,
  publisher: CONTACT_INFO.COMPANY_NAME,
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
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
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1d4ed8' }
  ],
  colorScheme: 'light'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <ClientWrapper>
          <div className="min-h-screen bg-background flex flex-col">
            {children}
          </div>
        </ClientWrapper>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
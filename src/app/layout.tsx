import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientWrapper from '@/components/ClientWrapper'
import { CONTACT_INFO } from '@/config/contact'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: CONTACT_INFO.COMPANY_NAME,
  description: CONTACT_INFO.COMPANY_DESCRIPTION,
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
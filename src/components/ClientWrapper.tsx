'use client'

import { Toaster } from 'react-hot-toast'
import ChatPopup from './ChatPopup'
import { MessagesProvider } from '@/contexts/MessagesContext'
import { useAuth } from '@/hooks/useAuth'

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  
  return (
    <MessagesProvider userId={user?._id || null}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <ChatPopup />
    </MessagesProvider>
  )
}
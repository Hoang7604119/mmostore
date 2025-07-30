'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useMessages } from '@/hooks/useMessages'
import type { Conversation, Message, MessageUser } from '@/hooks/useMessages'

interface MessagesContextType {
  conversations: Conversation[]
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  totalUnread: number
  loading: boolean
  error: string | null
  fetchConversations: (page?: number, limit?: number) => Promise<void>
  fetchMessages: (conversationId: string, page?: number, limit?: number) => Promise<any>
  sendMessage: (receiverId: string, content: string, messageType?: 'text' | 'image' | 'file' | 'system', attachments?: any[], metadata?: any) => Promise<any>
  sendMessageToConversation: (conversationId: string, receiverId: string, content: string, messageType?: 'text' | 'image' | 'file' | 'system', attachments?: any[], metadata?: any) => Promise<any>
  updateConversationFromMessage: (message: Message, currentUserId?: string) => void
  updateConversationReadStatus: (conversationId: string, readByUserId: string) => void
  markConversationAsRead: (conversationId: string) => Promise<void>
  forceRefresh: () => Promise<void>
  broadcastMessageRead: (data: any) => Promise<void>
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined)

interface MessagesProviderProps {
  children: ReactNode
  userId?: string | null
}

export const MessagesProvider: React.FC<MessagesProviderProps> = ({ children, userId }) => {
  const messagesHook = useMessages(userId)

  return (
    <MessagesContext.Provider value={messagesHook}>
      {children}
    </MessagesContext.Provider>
  )
}

export const useMessagesContext = () => {
  const context = useContext(MessagesContext)
  if (context === undefined) {
    throw new Error('useMessagesContext must be used within a MessagesProvider')
  }
  return context
}

export default MessagesContext
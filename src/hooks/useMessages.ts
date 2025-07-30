import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseRealtime } from './useSupabaseRealtime'

export interface MessageUser {
  _id: string
  username: string
  email: string
}

export interface LastMessage {
  content: string
  createdAt: string
  isRead: boolean
  senderId: string
  messageType: 'text' | 'image' | 'file' | 'system'
}

export interface Conversation {
  conversationId: string
  otherUser: MessageUser
  lastMessage: LastMessage
  unreadCount: number
}

export interface Message {
  _id: string
  senderId: MessageUser
  receiverId: MessageUser
  content: string
  messageType: 'text' | 'image' | 'file' | 'system'
  conversationId: string
  attachments: any[]
  metadata: any
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface ConversationsResponse {
  conversations: Conversation[]
  totalUnread: number
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}

export interface MessagesResponse {
  messages: Message[]
  otherUser: MessageUser | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  error?: string
}

export const useMessages = (userId?: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Setup Supabase Realtime (without callbacks to avoid double processing)
  // Components will handle the window events directly
  const { broadcastNewMessage, broadcastMessageRead } = useSupabaseRealtime({
    userId
    // Note: Removed onNewMessage and onMessageRead callbacks to prevent double processing
    // Components like ChatPopup and MessageIcon will handle window events directly
  })

  // Fetch conversations
  const fetchConversations = useCallback(async (page = 1, limit = 20) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/messages/conversations?page=${page}&limit=${limit}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.status === 401) {
        router.push('/login')
        return
      }

      const data: ConversationsResponse = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi tải cuộc trò chuyện')
      }

      setConversations(data.conversations)
      setTotalUnread(data.totalUnread)
      
    } catch (err) {
      console.error('Fetch conversations error:', err)
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
    } finally {
      setLoading(false)
    }
  }, [router])

  // Fetch messages in a conversation
  const fetchMessages = useCallback(async (conversationId: string, page = 1, limit = 50): Promise<MessagesResponse | null> => {
    try {
      setLoading(true)
      const response = await fetch(`/api/messages/${conversationId}?page=${page}&limit=${limit}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.status === 401) {
        router.push('/login')
        return null
      }

      const data: MessagesResponse = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi tải tin nhắn')
      }

      setMessages(data.messages)
      return data
      
    } catch (err) {
      console.error('Fetch messages error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [router])

  // Send message
  const sendMessage = useCallback(async (
    receiverId: string, 
    content: string, 
    messageType: 'text' | 'image' | 'file' | 'system' = 'text',
    attachments?: any[],
    metadata?: any
  ): Promise<{ message: Message; conversationId: string } | null> => {
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          receiverId,
          content,
          messageType,
          attachments,
          metadata
        })
      })

      if (response.status === 401) {
        router.push('/login')
        return null
      }

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi gửi tin nhắn')
      }

      // Broadcast new message via Supabase Realtime
      await broadcastNewMessage(data.message)

      // Refresh conversations to update last message
      await fetchConversations()
      
      return data
      
    } catch (err) {
      console.error('Send message error:', err)
      throw err
    }
  }, [router, fetchConversations, broadcastNewMessage])

  // Send message to existing conversation
  const sendMessageToConversation = useCallback(async (
    conversationId: string,
    receiverId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'system' = 'text',
    attachments?: any[],
    metadata?: any
  ): Promise<{ message: Message } | null> => {
    try {
      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          receiverId,
          content,
          messageType,
          attachments,
          metadata
        })
      })

      if (response.status === 401) {
        router.push('/login')
        return null
      }

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi gửi tin nhắn')
      }

      // Broadcast new message via Supabase Realtime
      await broadcastNewMessage(data.message)

      // Refresh conversations to update last message
      await fetchConversations()
      
      return data
      
    } catch (err) {
      console.error('Send message to conversation error:', err)
      throw err
    }
  }, [router, fetchConversations, broadcastNewMessage])

  // Update conversation from new message (for real-time updates)
  const updateConversationFromMessage = useCallback((message: Message, currentUserId?: string) => {
    setConversations(prevConversations => {
      const existingIndex = prevConversations.findIndex(
        conv => conv.conversationId === message.conversationId
      )

      const newLastMessage: LastMessage = {
        content: message.content,
        createdAt: message.createdAt,
        isRead: message.isRead,
        senderId: message.senderId._id,
        messageType: message.messageType
      }

      // Only increment unread count if message is from another user (not current user)
      const isFromOtherUser = currentUserId && message.senderId._id !== currentUserId
      const shouldIncrementUnread = isFromOtherUser && !message.isRead

      let updatedConversations: Conversation[]

      if (existingIndex >= 0) {
        // Update existing conversation
        updatedConversations = [...prevConversations]
        const existingConv = updatedConversations[existingIndex]
        
        updatedConversations[existingIndex] = {
          ...existingConv,
          lastMessage: newLastMessage,
          unreadCount: shouldIncrementUnread ? existingConv.unreadCount + 1 : existingConv.unreadCount
        }
        
        // Move to top
        const [updatedConv] = updatedConversations.splice(existingIndex, 1)
        updatedConversations = [updatedConv, ...updatedConversations]
      } else {
        // Create new conversation
        const otherUser = message.senderId
        const newConversation: Conversation = {
          conversationId: message.conversationId,
          otherUser,
          lastMessage: newLastMessage,
          unreadCount: shouldIncrementUnread ? 1 : 0
        }
        updatedConversations = [newConversation, ...prevConversations]
      }

      // Recalculate total unread count from all conversations
      const newTotalUnread = updatedConversations.reduce((total, conv) => total + conv.unreadCount, 0)
      setTotalUnread(newTotalUnread)

      return updatedConversations
    })
  }, [])

  // Update conversation read status (for when messages are marked as read)
  const updateConversationReadStatus = useCallback((conversationId: string, readByUserId: string) => {
    setConversations(prevConversations => {
      const updatedConversations = prevConversations.map(conv => {
        if (conv.conversationId === conversationId) {
          // Reset unread count for this conversation
          return {
            ...conv,
            unreadCount: 0
          }
        }
        return conv
      })

      // Recalculate total unread count
      const newTotalUnread = updatedConversations.reduce((total, conv) => total + conv.unreadCount, 0)
      setTotalUnread(newTotalUnread)

      return updatedConversations
    })
  }, [])

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      // Call the API to mark messages as read (this will trigger the read update)
      const response = await fetch(`/api/messages/${conversationId}?page=1&limit=1`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (response.ok) {
        // Update local state immediately
        updateConversationReadStatus(conversationId, userId || '')
        
        // Broadcast the read status via Supabase Realtime
        await broadcastMessageRead({ conversationId, readByUserId: userId || '' })
      }
    } catch (err) {
      console.error('Mark conversation as read error:', err)
    }
  }, [router, userId, updateConversationReadStatus, broadcastMessageRead])

  // Force refresh data from server
  const forceRefresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Call refresh API to clear any cache issues
      const refreshResponse = await fetch('/api/messages/refresh', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (refreshResponse.ok) {
        // Then fetch fresh conversations
        await fetchConversations()
      } else {
        throw new Error('Failed to refresh data')
      }
    } catch (err) {
      console.error('Force refresh error:', err)
      setError(err instanceof Error ? err.message : 'Lỗi khi làm mới dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [fetchConversations])

  // Auto-fetch conversations on mount
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    setConversations,
    messages,
    setMessages,
    totalUnread,
    loading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    sendMessageToConversation,
    updateConversationFromMessage,
    updateConversationReadStatus,
    markConversationAsRead,
    forceRefresh,
    broadcastMessageRead
  }
}
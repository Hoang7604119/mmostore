import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { Message } from './useMessages'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinUserRoom: (userId: string) => void
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
  sendMessage: (message: any) => void
  sendTypingStart: (conversationId: string) => void
  sendTypingStop: (conversationId: string) => void
  markMessageAsRead: (conversationId: string, messageId: string) => void
}

export const useSocket = (userId?: string): SocketContextType => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const userIdRef = useRef<string | undefined>(userId)

  // Update userIdRef when userId changes
  useEffect(() => {
    userIdRef.current = userId
  }, [userId])

  useEffect(() => {
    // Only create socket if it doesn't exist
    if (socketRef.current) return

    // Initialize socket connection
    const initSocket = () => {
      try {
        // Connect to Socket.io server
        const socketUrl = process.env.NODE_ENV === 'production' 
          ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
          : 'http://localhost:3000'
        
        console.log('Connecting to Socket.IO server:', socketUrl)
        
        const socketInstance = io(socketUrl, {
          transports: ['polling', 'websocket'], // Try polling first for better compatibility
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000,
          reconnectionDelayMax: 10000,
          timeout: 30000,
          forceNew: false,
          upgrade: true
        })

        socketInstance.on('connect', () => {
          console.log('Connected to Socket.io server:', socketInstance.id)
          setIsConnected(true)
        })

        socketInstance.on('disconnect', () => {
          console.log('Disconnected from Socket.io server')
          setIsConnected(false)
        })

        socketInstance.on('connect_error', (error) => {
          console.error('Socket connection error:', error)
          setIsConnected(false)
        })

        socketRef.current = socketInstance
        setSocket(socketInstance)

      } catch (error) {
        console.error('Failed to initialize socket:', error)
      }
    }

    initSocket()

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [])

  // Separate useEffect for joining user room when userId or connection changes
  useEffect(() => {
    if (socket && isConnected && userId) {
      socket.emit('join-user-room', userId)
    }
  }, [socket, isConnected, userId])

  const joinUserRoom = useCallback((userId: string) => {
    if (socket && isConnected) {
      socket.emit('join-user-room', userId)
    }
  }, [socket, isConnected])

  const joinConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('join-conversation', conversationId)
    }
  }, [socket, isConnected])

  const leaveConversation = useCallback((conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-conversation', conversationId)
    }
  }, [socket, isConnected])

  const sendMessage = useCallback((message: any) => {
    if (socket && isConnected) {
      socket.emit('new-message', message)
    }
  }, [socket, isConnected])

  const sendTypingStart = useCallback((conversationId: string) => {
    if (socket && isConnected && userId) {
      socket.emit('typing-start', { conversationId, userId })
    }
  }, [socket, isConnected, userId])

  const sendTypingStop = useCallback((conversationId: string) => {
    if (socket && isConnected && userId) {
      socket.emit('typing-stop', { conversationId, userId })
    }
  }, [socket, isConnected, userId])

  const markMessageAsRead = useCallback((conversationId: string, messageId: string) => {
    if (socket && isConnected) {
      socket.emit('message-read', { conversationId, messageId })
    }
  }, [socket, isConnected])

  return {
    socket,
    isConnected,
    joinUserRoom,
    joinConversation,
    leaveConversation,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    markMessageAsRead
  }
}

// Hook for listening to socket events
export const useSocketEvents = (socket: Socket | null) => {
  const [newMessage, setNewMessage] = useState<Message | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [newNotification, setNewNotification] = useState<any | null>(null)

  useEffect(() => {
    if (!socket) return

    // Listen for new messages
    socket.on('message-received', (message: Message) => {
      // Always create a new object to ensure state change detection
      setNewMessage({ ...message })
    })

    // Listen for typing indicators
    socket.on('user-typing', (data: { userId: string, username?: string }) => {
      setTypingUsers(prev => {
        if (!prev.includes(data.userId)) {
          return [...prev, data.userId]
        }
        return prev
      })
    })

    socket.on('user-stopped-typing', (data: { userId: string }) => {
      setTypingUsers(prev => prev.filter(userId => userId !== data.userId))
    })

    // Listen for notifications (legacy - for backward compatibility)
    socket.on('new-notification', (notification: any) => {
      setNotifications(prev => [notification, ...prev])
      // Also set as new notification for immediate processing
      setNewNotification({ ...notification })
    })

    // Listen for message read updates
    socket.on('message-read-update', (data: any) => {
      // Handle message read status update
      console.log('Message read update:', data)
      // Don't call fetchConversations here as it's handled by individual components
      // to avoid multiple simultaneous API calls
    })

    // Cleanup listeners
    return () => {
      socket.off('message-received')
      socket.off('user-typing')
      socket.off('user-stopped-typing')
      socket.off('new-notification')
      socket.off('message-read-update')
    }
  }, [socket])

  return {
    newMessage,
    typingUsers,
    notifications,
    newNotification,
    clearNewMessage: () => setNewMessage(null),
    clearNotifications: () => setNotifications([])
  }
}
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useMessagesContext } from '@/contexts/MessagesContext'
import { type Message, type Conversation } from '@/hooks/useMessages'

import { MessageCircle, Send, ArrowLeft, User, Loader2, RefreshCw, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import LoadingSpinner from '@/components/LoadingSpinner'
import { UserData } from '@/types/user'
import MessageFileUpload from '@/components/MessageFileUpload'
import MessageAttachment from '@/components/MessageAttachment'

interface UserWithCredit extends UserData {
  credit: number
}

const MessagesPage: React.FC = () => {
  const router = useRouter()
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const { 
    conversations, 
    setConversations,
    totalUnread, 
    loading, 
    error, 
    fetchConversations, 
    fetchMessages, 
    sendMessageToConversation,
    updateConversationFromMessage,
    forceRefresh 
  } = useMessagesContext()
  
  // Supabase Realtime integration
  
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [pendingAttachment, setPendingAttachment] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)

  // Check authentication and get user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      } finally {
        setUserLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Auto scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Handle new messages from Supabase Realtime
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const newMessage = event.detail
      if (newMessage && user) {
        // Use the shared updateConversationFromMessage function
        updateConversationFromMessage(newMessage, user._id)
        
        // If message belongs to current conversation, add to messages (only for received messages)
        if (selectedConversation && 
            newMessage.conversationId === selectedConversation.conversationId &&
            newMessage.senderId._id !== user._id) {
          // Check if message is not already in the list (avoid duplicates)
          const messageExists = messages.some(msg => msg._id === newMessage._id)
          if (!messageExists) {
            setMessages(prev => [...prev, newMessage])
            scrollToBottom()
          }
        }
      }
    }

    window.addEventListener('new-message', handleNewMessage as EventListener)
    
    return () => {
      window.removeEventListener('new-message', handleNewMessage as EventListener)
    }
  }, [selectedConversation, messages, user, updateConversationFromMessage])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Channel management for Supabase Realtime
  useEffect(() => {
    // Supabase Realtime channels are managed globally
    // No need for manual join/leave operations
  }, [selectedConversation?.conversationId])

  // Load messages when conversation is selected
  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setMessagesLoading(true)
    
    try {
      const response = await fetchMessages(conversation.conversationId)
      if (response) {
        setMessages(response.messages)
        // Don't call fetchConversations here as it will be called by message-read-update event
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setMessagesLoading(false)
    }
  }

  // Typing indicators removed for Supabase Realtime migration
  // Can be re-implemented later if needed

  const handleFileSelect = (file: File, type: 'image' | 'file') => {
    setIsUploading(true)
  }

  const handleUploadComplete = (attachment: any) => {
    setPendingAttachment(attachment)
    setIsUploading(false)
  }

  const removePendingAttachment = () => {
    setPendingAttachment(null)
  }

  // Send new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if ((!newMessage.trim() && !pendingAttachment) || !selectedConversation || sendingMessage) {
      return
    }

    setSendingMessage(true)
    
    // Typing indicators removed for Supabase Realtime migration
    
    try {
      const messageContent = newMessage.trim() || (pendingAttachment ? `[${pendingAttachment.type === 'image' ? 'Hình ảnh' : 'File'}]` : '')
      const messageType = pendingAttachment ? pendingAttachment.type : 'text'
      const attachments = pendingAttachment ? [pendingAttachment] : []
      
      const response = await sendMessageToConversation(
        selectedConversation.conversationId,
        selectedConversation.otherUser._id,
        messageContent,
        messageType,
        attachments
      )
      
      if (response) {
        // Add message to local state immediately for sender
        setMessages(prev => [...prev, response.message])
        setNewMessage('')
        setPendingAttachment(null)
        messageInputRef.current?.focus()
        scrollToBottom()
        
        // Update conversations list with new message
        setConversations(prev => {
          const updatedConversations = prev.map(conv => {
            if (conv.conversationId === selectedConversation.conversationId) {
              return {
                ...conv,
                lastMessage: {
                  content: response.message.content,
                  createdAt: response.message.createdAt,
                  isRead: true,
                  senderId: response.message.senderId._id,
                  messageType: response.message.messageType
                }
              }
            }
            return conv
          })
          
          // Sort conversations by last message time
          return updatedConversations.sort((a, b) => 
            new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
          )
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSendingMessage(false)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua'
    } else {
      return date.toLocaleDateString('vi-VN')
    }
  }

  if (userLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Page Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-2xl mb-6 backdrop-blur-sm border border-blue-500/20">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Tin nhắn</h1>
                  <p className="text-blue-100 text-sm mt-1 font-medium">Quản lý và trò chuyện với người dùng khác</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {totalUnread > 0 && (
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg animate-pulse">
                    {totalUnread} tin nhắn mới
                  </div>
                )}
                <button
                  onClick={() => router.push('/dashboard/messages/new')}
                  className="bg-white/95 backdrop-blur-sm text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-white transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Send className="w-4 h-4" />
                  <span>Tin nhắn mới</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200/50 h-[calc(100vh-12rem)]">
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${
              selectedConversation ? 'hidden md:flex' : 'flex'
            }`}>
              {/* Sidebar Header */}
              <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-blue-50/30 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Cuộc trò chuyện</h2>
                  <button
                    onClick={() => forceRefresh()}
                    disabled={loading}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl disabled:opacity-50 transition-all duration-200 hover:scale-110 shadow-sm"
                    title="Làm mới dữ liệu"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                {error && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                    {error}
                  </div>
                )}
              </div>

              {/* Conversations List */}
                <div className="flex-1 overflow-y-auto messages-container">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageCircle className="h-12 w-12 mb-4" />
                    <p className="text-lg font-medium">Chưa có tin nhắn nào</p>
                    <p className="text-sm">Bắt đầu cuộc trò chuyện đầu tiên của bạn</p>
                  </div>
                ) : (
                  conversations.map((conversation) => (
                    <div
                      key={conversation.conversationId}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`p-4 border-b border-gray-100/50 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 hover:scale-[1.02] ${
                        selectedConversation?.conversationId === conversation.conversationId
                          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200/50 shadow-sm'
                          : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-sm font-bold text-white">
                              {conversation.otherUser.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {conversation.otherUser.username}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessage.createdAt)}
                              </span>
                              {conversation.unreadCount > 0 && (
                                <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className={`text-sm mt-1 truncate ${
                            conversation.lastMessage.isRead ? 'text-gray-500' : 'text-gray-900 font-medium'
                          }`}>
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${
              selectedConversation ? 'flex' : 'hidden md:flex'
            }`}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-white to-blue-50/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setSelectedConversation(null)}
                          className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-xl transition-all duration-200"
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-sm font-bold text-white">
                            {selectedConversation.otherUser.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-lg font-medium text-gray-900">
                            {selectedConversation.otherUser.username}
                          </h2>
                          <p className="text-sm text-gray-500">
                            {selectedConversation.otherUser.email}
                          </p>
                        </div>
                      </div>
                      
                      {/* Real-time messaging is now handled by Supabase */}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 messages-container">
                    {messagesLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const isCurrentUser = message.senderId._id === selectedConversation.otherUser._id ? false : true
                        const showDate = index === 0 || 
                          formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt)
                        
                        return (
                          <div key={`${message._id}-${index}`}>
                            {showDate && (
                              <div className="text-center my-4">
                                <span className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 text-xs px-4 py-2 rounded-full shadow-sm backdrop-blur-sm border border-gray-200/50">
                                  {formatDate(message.createdAt)}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 ${
                                isCurrentUser 
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                                  : 'bg-white border border-gray-200/50 text-gray-900 backdrop-blur-sm'
                              }`}>
                                <p className="text-sm">{message.content}</p>
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2">
                                    {message.attachments.map((attachment, attachIndex) => (
                                      <MessageAttachment
                                        key={attachIndex}
                                        attachment={attachment}
                                        isCurrentUser={isCurrentUser}
                                      />
                                    ))}
                                  </div>
                                )}
                                <p className={`text-xs mt-1 ${
                                  isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {formatTime(message.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                    
                    {/* Typing indicators removed for Supabase Realtime migration */}
                    
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-white to-blue-50/20 backdrop-blur-sm">
                    {/* Pending Attachment Preview */}
                    {pendingAttachment && (
                      <div className="mb-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl shadow-sm backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-blue-700 font-medium">
                              {pendingAttachment.type === 'image' ? '🖼️' : '📎'} {pendingAttachment.name}
                            </div>
                            <div className="text-xs text-blue-500">
                              ({Math.round(pendingAttachment.size / 1024)} KB)
                            </div>
                          </div>
                          <button
                            onClick={removePendingAttachment}
                            className="text-blue-400 hover:text-red-500 hover:bg-white/50 rounded-lg p-1 transition-all duration-200"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <MessageFileUpload
                            onFileSelect={handleFileSelect}
                            onUploadComplete={handleUploadComplete}
                            disabled={isUploading}
                          />
                        </div>
                        <form onSubmit={handleSendMessage} className="flex space-x-2">
                          <textarea
                            ref={messageInputRef}
                            value={newMessage}
                            onChange={(e) => {
                              setNewMessage(e.target.value)
                            }}
                            onKeyPress={handleKeyPress}
                            placeholder="Nhập tin nhắn..."
                            rows={1}
                            className="flex-1 resize-none border border-gray-300/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm bg-white/80 shadow-sm transition-all duration-200"
                            disabled={sendingMessage}
                          />
                          <button
                            type="submit"
                            disabled={(!newMessage.trim() && !pendingAttachment) || sendingMessage || isUploading}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-110 transition-all duration-200"
                          >
                            {sendingMessage ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center p-8 rounded-2xl bg-gradient-to-r from-gray-50 to-blue-50/30 backdrop-blur-sm border border-gray-200/50 shadow-sm">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
                      <MessageCircle className="h-10 w-10 text-blue-500" />
                    </div>
                    <h2 className="text-xl font-semibold mb-3 text-gray-700">Chọn một cuộc trò chuyện</h2>
                    <p className="text-sm text-gray-500">Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MessagesPage
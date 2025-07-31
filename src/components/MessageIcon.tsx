'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle, Send, User, Loader2 } from 'lucide-react'
import { useMessagesContext } from '@/contexts/MessagesContext'
import LoadingSpinner from './LoadingSpinner'

interface MessageIconProps {
  userId: string | null
  className?: string
}

// Interfaces are now imported from useMessages hook

const MessageIcon: React.FC<MessageIconProps> = ({ userId, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { conversations, totalUnread, loading, error, fetchConversations, updateConversationReadStatus, markConversationAsRead } = useMessagesContext()
  
  // Handle message read updates from Supabase Realtime
  useEffect(() => {
    const handleMessageReadUpdate = (event: CustomEvent) => {
      const data = event.detail
      console.log('MessageIcon: Received message-read-update:', data)
      // Update conversation read status immediately for better UX
      if (data.conversationId && data.readByUserId) {
        updateConversationReadStatus(data.conversationId, data.readByUserId)
      }
      // Note: No need to call fetchConversations() here as updateConversationReadStatus() already updates the local state
    }

    window.addEventListener('message-read-update', handleMessageReadUpdate as EventListener)
    
    return () => {
      window.removeEventListener('message-read-update', handleMessageReadUpdate as EventListener)
    }
  }, [updateConversationReadStatus])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRefresh = () => {
    fetchConversations()
  }

  // Handle clicking on message icon
  const handleIconClick = () => {
    setIsOpen(!isOpen)
  }

  // Handle clicking on a specific conversation
  const handleConversationClick = async (conversationId: string) => {
    setIsOpen(false)
    // Mark this specific conversation as read (only if it has unread messages)
    const conversation = conversations.find(conv => conv.conversationId === conversationId)
    if (conversation && conversation.unreadCount > 0) {
      await markConversationAsRead(conversationId)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Vừa xong'
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} ngày trước`
    
    return date.toLocaleDateString('vi-VN')
  }

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message
    return message.substring(0, maxLength) + '...'
  }

  // Show recent conversations (max 5)
  const recentConversations = conversations.slice(0, 5)

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Message Icon */}
      <button
        onClick={handleIconClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
        aria-label="Tin nhắn"
      >
        {/* Message Circle Icon */}
        <MessageCircle className="w-6 h-6" />
        
        {/* Unread Count Badge */}
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
        
        {/* Real-time Connection Indicator - Always connected with Supabase */}
        <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white bg-green-500" title="Tin nhắn thời gian thực: Đã kết nối" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed top-16 right-2 sm:absolute sm:top-auto sm:right-0 sm:mt-2 w-72 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 z-[80] max-h-[calc(100vh-5rem)] sm:max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-white/80">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Tin nhắn</h3>
              <div className="flex items-center space-x-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                <Link
                  href="/dashboard/messages"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Xem tất cả
                </Link>
              </div>
            </div>
            {error && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                {error}
                <button 
                  onClick={handleRefresh}
                  className="ml-2 underline hover:no-underline"
                >
                  Thử lại
                </button>
              </div>
            )}
          </div>

          {/* Conversations List */}
          <div className="max-h-48 sm:max-h-64 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <LoadingSpinner size="xs" fullScreen={false} />
                <p className="mt-2">Đang tải...</p>
              </div>
            ) : recentConversations.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Chưa có tin nhắn nào</p>
                <p className="text-xs mt-1">Bắt đầu trò chuyện với người bán hoặc người mua</p>
              </div>
            ) : (
              recentConversations.map((conversation) => (
                <Link
                  key={conversation.conversationId}
                  href={`/dashboard/messages`}
                  className={`block px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    conversation.unreadCount > 0 ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => handleConversationClick(conversation.conversationId)}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                    
                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium text-gray-900 truncate ${
                          conversation.unreadCount > 0 ? 'font-semibold' : ''
                        }`}>
                          {conversation.otherUser.username}
                        </p>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {formatTimeAgo(conversation.lastMessage.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.senderId === userId ? (
                            <span className="text-gray-500">Bạn: </span>
                          ) : null}
                          {truncateMessage(conversation.lastMessage.content)}
                        </p>
                        
                        {conversation.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 ml-2">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-t border-gray-200 bg-gray-50">
            <Link
              href="/dashboard/messages/new"
              className="flex items-center justify-center space-x-2 w-full text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors touch-manipulation"
              onClick={() => setIsOpen(false)}
            >
              <Send className="w-4 h-4" />
              <span>Tin nhắn mới</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageIcon
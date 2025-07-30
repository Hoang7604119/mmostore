'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMessagesContext } from '@/contexts/MessagesContext'
import { type Conversation, type Message } from '@/hooks/useMessages'
import { useAuth } from '@/hooks/useAuth'

import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react'
import MessageFileUpload from './MessageFileUpload'
import MessageAttachment from './MessageAttachment'

export default function ChatPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [pendingAttachment, setPendingAttachment] = useState<any>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  const { user } = useAuth()
  const { conversations, setConversations, messages, setMessages, totalUnread, loading, sendMessageToConversation, fetchMessages, fetchConversations, updateConversationFromMessage, updateConversationReadStatus } = useMessagesContext()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentConversationRef = useRef<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle new messages from Supabase Realtime
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const newMessage = event.detail
      if (newMessage && user) {
        // Use the shared updateConversationFromMessage function
        updateConversationFromMessage(newMessage, user._id)
        
        // If message belongs to current conversation, add to messages (only for received messages)
        if (selectedConversation && 
            newMessage.conversationId === selectedConversation &&
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
  }, [selectedConversation, messages, user, updateConversationFromMessage, setMessages])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
      // Don't call fetchConversations here as it will be called by message-read-update event
    }
  }, [selectedConversation, fetchMessages])

  // Handle message read updates from Supabase Realtime
  useEffect(() => {
    const handleMessageReadUpdate = (event: CustomEvent) => {
      const data = event.detail
      console.log('ChatPopup: Received message-read-update:', data)
      // Update conversation read status immediately for better UX
      if (data.conversationId && data.readByUserId) {
        updateConversationReadStatus(data.conversationId, data.readByUserId)
      }
      // Refresh conversations to update unread counts
      fetchConversations()
      
      // If the read update is for current conversation, refresh messages
      if (selectedConversation && data.conversationId === selectedConversation) {
        fetchMessages(selectedConversation)
      }
    }

    window.addEventListener('message-read-update', handleMessageReadUpdate as EventListener)
    
    return () => {
      window.removeEventListener('message-read-update', handleMessageReadUpdate as EventListener)
    }
  }, [fetchConversations, fetchMessages, selectedConversation, updateConversationReadStatus])
  
  // Handle conversation selection
  useEffect(() => {
    if (selectedConversation) {
      currentConversationRef.current = selectedConversation
    }
    
    // Cleanup when component unmounts or conversation is cleared
    return () => {
      if (currentConversationRef.current && !selectedConversation) {
        currentConversationRef.current = null
      }
    }
  }, [selectedConversation])

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !pendingAttachment) || !selectedConversation) return
    
    const currentConversation = conversations.find(c => c.conversationId === selectedConversation)
    if (!currentConversation) return
    
    try {
      const messageContent = newMessage.trim() || (pendingAttachment ? `[${pendingAttachment.type === 'image' ? 'Hình ảnh' : 'File'}] ${pendingAttachment.name}` : '')
      const messageType = pendingAttachment ? pendingAttachment.type : 'text'
      const attachments = pendingAttachment ? [pendingAttachment] : []
      
      await sendMessageToConversation(
        selectedConversation, 
        currentConversation.otherUser._id, 
        messageContent,
        messageType,
        attachments
      )
      
      setNewMessage('')
      setPendingAttachment(null)
      // Refresh messages after sending
      await fetchMessages(selectedConversation)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

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

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users || [])
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const startNewConversation = async (userId: string) => {
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: userId,
          content: 'Xin chào!'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedConversation(data.conversationId)
        setShowNewChat(false)
        setSearchQuery('')
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.otherUser
  }

  if (!user) return null

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 z-50 backdrop-blur-sm border border-blue-500/20 hover:scale-110"
        >
          <MessageCircle size={24} />
          {totalUnread > 0 && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-pulse">
              {totalUnread}
            </div>
          )}
        </button>
      )}

      {/* Chat Popup */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-2xl z-50 transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-96 h-[500px]'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <MessageCircle size={20} />
              <span className="font-medium">
                {selectedConversation && !showNewChat
                  ? `Chat với ${conversations.find(c => c.conversationId === selectedConversation)?.otherUser?.username || 'Unknown'}`
                  : showNewChat
                  ? 'Tin nhắn mới'
                  : 'Tin nhắn'
                }
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 p-2 rounded-xl transition-all duration-200 hover:scale-110"
              >
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                }}
                className="hover:bg-white/20 p-2 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex flex-col h-[436px]">
              {/* Content */}
              {!selectedConversation && !showNewChat ? (
                /* Conversation List */
                <div className="flex-1 overflow-y-auto messages-container">
                  <div className="p-4">
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200 mb-4 shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02]"
                    >
                      + Tin nhắn mới
                    </button>
                    
                    {loading ? (
                      <div className="text-center py-4 text-gray-500">Đang tải...</div>
                    ) : conversations.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">Chưa có cuộc trò chuyện nào</div>
                    ) : (
                      <div className="space-y-2">
                        {conversations.map((conversation) => {
                          const otherParticipant = getOtherParticipant(conversation)
                          return (
                            <div
                              key={conversation.conversationId}
                              onClick={() => {
                                setSelectedConversation(conversation.conversationId)
                                // fetchMessages will trigger message-read-update event which will update conversations
                              }}
                              className="p-3 border border-gray-200/50 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 backdrop-blur-sm hover:shadow-md hover:scale-[1.02]"
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-gray-900">
                                  {otherParticipant?.username || 'Unknown'}
                                </div>
                                {conversation.lastMessage && (
                                  <div className="text-xs text-gray-500">
                                    {formatTime(conversation.lastMessage.createdAt)}
                                  </div>
                                )}
                              </div>
                              {conversation.lastMessage && (
                                <div className="text-sm text-gray-600 truncate mt-1 font-medium">
                                  {conversation.lastMessage.content}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : showNewChat ? (
                /* New Chat */
                <div className="flex-1 p-4">
                  <div className="mb-4">
                    <button
                      onClick={() => setShowNewChat(false)}
                      className="text-blue-600 hover:text-blue-700 text-sm mb-3 font-medium hover:bg-blue-50 px-3 py-1 rounded-lg transition-all duration-200"
                    >
                      ← Quay lại
                    </button>
                    <input
                      type="text"
                      placeholder="Tìm kiếm người dùng..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        searchUsers(e.target.value)
                      }}
                      className="w-full p-3 border border-gray-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80 shadow-sm transition-all duration-200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    {isSearching ? (
                      <div className="text-center py-4 text-gray-500">Đang tìm kiếm...</div>
                    ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                      <div className="text-center py-4 text-gray-500">Không tìm thấy người dùng nào</div>
                    ) : (
                      searchResults.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => startNewConversation(user._id)}
                          className="p-3 border border-gray-200/50 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 backdrop-blur-sm hover:shadow-md hover:scale-[1.02]"
                        >
                          <div className="font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Chat Messages */
                <>
                  {/* Fixed Back Button */}
                  <div className="p-4 pb-2 border-b border-gray-200/50">
                    <button
                      onClick={() => {
                        setSelectedConversation(null)
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:bg-blue-50 px-3 py-2 rounded-lg transition-all duration-200"
                    >
                      ← Quay lại danh sách
                    </button>
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 messages-container">
                    {loading ? (
                      <div className="text-center py-4 text-gray-500">Đang tải tin nhắn...</div>
                    ) : !messages || messages.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">Chưa có tin nhắn nào</div>
                    ) : (
                      messages.map((message: Message) => (
                        <div
                          key={message._id}
                          className={`flex ${message.senderId._id === user._id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm ${
                              message.senderId._id === user._id
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                                : 'bg-white border border-gray-200/50 text-gray-900 backdrop-blur-sm'
                            }`}
                          >
                            <div className="text-sm">{message.content}</div>
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2">
                                {message.attachments.map((attachment, index) => (
                                  <MessageAttachment
                                    key={index}
                                    attachment={attachment}
                                    isCurrentUser={message.senderId._id === user._id}
                                  />
                                ))}
                              </div>
                            )}
                            <div className={`text-xs mt-1 ${
                              message.senderId._id === user._id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTime(message.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    {/* Pending Attachment Preview */}
                    {pendingAttachment && (
                      <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl backdrop-blur-sm shadow-sm">
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
                            className="text-blue-400 hover:text-red-500 transition-all duration-200 hover:scale-110 p-1 rounded-lg hover:bg-white/50"
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
                        <input
                          type="text"
                          placeholder="Nhập tin nhắn..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="w-full p-3 border border-gray-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80 shadow-sm transition-all duration-200"
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={(!newMessage.trim() && !pendingAttachment) || isUploading}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-blue-500/25 hover:scale-105"
                      >
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
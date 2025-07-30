'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMessages } from '@/hooks/useMessages'
import { ArrowLeft, Send, User, Search, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/Header'
import { UserData } from '@/types/user'

interface UserWithCredit extends UserData {
  credit: number
}

interface UserSearchResult {
  _id: string
  username: string
  email: string
}

const NewMessagePage: React.FC = () => {
  const router = useRouter()
  const { sendMessage } = useMessages()
  const { user: authUser } = useAuth()
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [message, setMessage] = useState('')
  const [searching, setSearching] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Search users
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      setError(null)
      
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi khi tìm kiếm người dùng')
      }

      // Filter out current user
      const filteredResults = data.users.filter((u: UserSearchResult) => u._id !== user?._id)
      setSearchResults(filteredResults)
      
    } catch (err) {
      console.error('Search users error:', err)
      setError(err instanceof Error ? err.message : 'Lỗi không xác định')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUser || !message.trim() || sending) {
      return
    }

    setSending(true)
    setError(null)
    
    try {
      const response = await sendMessage(selectedUser._id, message.trim())
      
      if (response) {
        // Redirect to messages page
        router.push(`/dashboard/messages`)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.')
    } finally {
      setSending(false)
    }
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg mb-6">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 text-blue-100 hover:text-white hover:bg-blue-500 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">Tạo tin nhắn mới</h1>
                  <p className="text-blue-100 text-sm mt-1">Gửi tin nhắn đến người dùng khác trong hệ thống</p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-blue-100">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Messenger</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {/* User Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm người nhận
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập tên người dùng hoặc email..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searching && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-sm max-h-60 overflow-y-auto">
                  {searchResults.map((userResult) => (
                    <button
                      key={userResult._id}
                      onClick={() => {
                        setSelectedUser(userResult)
                        setSearchQuery('')
                        setSearchResults([])
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{userResult.username}</p>
                          <p className="text-xs text-gray-500">{userResult.email}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected User */}
              {selectedUser && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{selectedUser.username}</p>
                        <p className="text-xs text-gray-500">{selectedUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tin nhắn
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập tin nhắn của bạn..."
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  disabled={!selectedUser}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {message.length}/2000 ký tự
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Send Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedUser || !message.trim() || sending}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{sending ? 'Đang gửi...' : 'Gửi tin nhắn'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewMessagePage
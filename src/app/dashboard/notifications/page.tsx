'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useNotifications } from '@/hooks/useNotificationsHook'
// Removed useNotificationStream to prevent duplicate notifications - using Socket.io instead
import { INotification } from '@/models/Notification'
import { UserData } from '@/types/user'
import Header from '@/components/Header'

interface UserWithCredit extends UserData {
  credit: number
}

const NotificationsPage: React.FC = () => {
  const router = useRouter()
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  
  const userId = user?._id || null
  const {
    notifications,
    unreadCount,
    loading,
    pagination,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh,
    hasMore,
    fetchNotifications,
    addNotification
  } = useNotifications(userId)





  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          router.push('/auth/login')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/auth/login')
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Real-time notifications are now handled by Socket.io in NotificationIcon
  // This prevents duplicate notifications from both SSE and Socket.io

  // Refetch when filters change
  useEffect(() => {
    if (userId) {
      fetchNotifications(
        1,
        20,
        showUnreadOnly,
        selectedCategory === 'all' ? undefined : selectedCategory
      )
    }
  }, [selectedCategory, showUnreadOnly, userId, fetchNotifications])

  const handleNotificationClick = async (notification: INotification, event?: React.MouseEvent) => {
    try {
      // Prevent event bubbling if it's a nested click
      if (event) {
        event.stopPropagation()
      }
      
      if (!notification.isRead && notification._id) {
        await markAsRead(notification._id)
      }
    } catch (error) {
      console.error('Error handling notification click:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅'
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Vừa xong'
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} giờ trước`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} ngày trước`
    
    return new Date(date).toLocaleDateString('vi-VN')
  }

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'product', label: 'Sản phẩm' },
    { value: 'order', label: 'Đơn hàng' },
    { value: 'account', label: 'Tài khoản' },
    { value: 'payment', label: 'Thanh toán' },
    { value: 'system', label: 'Hệ thống' }
  ]

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Header user={user} onLogout={handleLogout} />}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã được đọc'}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refresh}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Làm mới
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Danh mục:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Unread Filter */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Chỉ hiển thị chưa đọc</span>
            </label>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading && notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Đang tải thông báo...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có thông báo</h3>
              <p className="text-gray-500">
                {showUnreadOnly ? 'Không có thông báo chưa đọc nào' : 'Bạn chưa có thông báo nào'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  {notification.actionUrl ? (
                    <Link 
                      href={notification.actionUrl} 
                      className="block cursor-pointer"
                      onClick={(e) => handleNotificationClick(notification, e)}
                    >
                      <NotificationItem 
                        notification={notification} 
                        formatTimeAgo={formatTimeAgo} 
                        getNotificationIcon={getNotificationIcon} 
                      />
                    </Link>
                  ) : (
                    <div 
                      className="cursor-pointer"
                      onClick={(e) => handleNotificationClick(notification, e)}
                    >
                      <NotificationItem 
                        notification={notification} 
                        formatTimeAgo={formatTimeAgo} 
                        getNotificationIcon={getNotificationIcon} 
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="p-6 border-t border-gray-200 text-center">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang tải...' : 'Tải thêm'}
              </button>
            </div>
          )}
        </div>

        {/* Pagination Info */}
        {notifications.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Hiển thị {notifications.length} / {pagination.total} thông báo
          </div>
        )}
      </div>
    </div>
  )
}

// Separate component for notification item
const NotificationItem: React.FC<{
  notification: INotification
  formatTimeAgo: (date: Date) => string
  getNotificationIcon: (type: string) => string
}> = ({ notification, formatTimeAgo, getNotificationIcon }) => (
  <div className="flex items-start space-x-4">
    <span className="text-2xl flex-shrink-0 mt-1">
      {getNotificationIcon(notification.type)}
    </span>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className={`text-lg font-medium text-gray-900 ${
            !notification.isRead ? 'font-semibold' : ''
          }`}>
            {notification.title}
          </h3>
          <p className="text-gray-600 mt-1 leading-relaxed">
            {notification.message}
          </p>
          
          {/* Metadata */}
          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Chi tiết:</h4>
              <div className="space-y-1">
                {Object.entries(notification.metadata).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{key}:</span>
                    <span className="text-gray-900 font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {!notification.isRead && (
          <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-2 ml-4"></div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-500">
          {formatTimeAgo(notification.createdAt)}
        </span>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
            {notification.category}
          </span>
          {notification.actionText && (
            <span className="text-sm text-blue-600 font-medium">
              {notification.actionText} →
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
)

export default NotificationsPage
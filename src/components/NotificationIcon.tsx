'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/hooks/useNotificationsHook'
import { useSocket, useSocketEvents } from '@/hooks/useSocket'
import { INotification } from '@/models/Notification'
import LoadingSpinner from './LoadingSpinner'

interface NotificationIconProps {
  userId: string | null
  className?: string
}

const NotificationIcon: React.FC<NotificationIconProps> = ({ userId, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [realtimeEnabled, setRealtimeEnabled] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, fetchNotifications, addNotification } = useNotifications(userId)
  
  // Socket.io integration for real-time notifications
  const { socket, isConnected, joinUserRoom } = useSocket(userId || undefined)
  const { newNotification } = useSocketEvents(socket)
  
  // Handle individual new notification for immediate updates (avoiding duplicates)
  useEffect(() => {
    if (newNotification && userId && newNotification.type !== 'message') {
      const notification: INotification = {
        _id: newNotification._id || `socket_${Date.now()}`,
        title: newNotification.title || 'Thông báo mới',
        message: newNotification.message || 'Bạn có thông báo mới',
        type: newNotification.type || 'info',
        category: newNotification.category || 'system',
        isRead: false,
        actionUrl: newNotification.actionUrl,
        actionText: newNotification.actionText,
        createdAt: newNotification.createdAt || new Date(),
        updatedAt: newNotification.updatedAt || new Date(),
        userId: userId,
        metadata: newNotification.metadata || {}
      }
      addNotification(notification)
    }
  }, [newNotification, userId, addNotification])

  // Join user room when connected
  useEffect(() => {
    if (isConnected && userId) {
      joinUserRoom(userId)
    }
  }, [isConnected, userId, joinUserRoom])
  
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

  const handleNotificationClick = async (notification: INotification, event?: React.MouseEvent) => {
    try {
      // Prevent event bubbling if it's a nested click
      if (event) {
        event.stopPropagation()
      }
      
      if (!notification.isRead && notification._id) {
        await markAsRead(notification._id)
      }
      
      setIsOpen(false)
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

  // Show recent notifications (max 5)
  const recentNotifications = notifications.slice(0, 5)

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
        aria-label="Thông báo"
      >
        {/* Bell Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {/* Real-time Connection Indicator */}
        {realtimeEnabled && (
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`} title={`Thông báo thời gian thực: ${isConnected ? 'Đã kết nối' : 'Ngắt kết nối'}`} />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-white/80">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <LoadingSpinner size="xs" fullScreen={false} />
                <p className="mt-2">Đang tải...</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              recentNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  {notification.actionUrl ? (
                    <Link 
                      href={notification.actionUrl} 
                      className="block cursor-pointer"
                      onClick={(e) => handleNotificationClick(notification, e)}
                    >
                      <NotificationContent notification={notification} formatTimeAgo={formatTimeAgo} getNotificationIcon={getNotificationIcon} />
                    </Link>
                  ) : (
                    <div 
                      className="cursor-pointer"
                      onClick={(e) => handleNotificationClick(notification, e)}
                    >
                      <NotificationContent notification={notification} formatTimeAgo={formatTimeAgo} getNotificationIcon={getNotificationIcon} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <Link
                href="/dashboard/notifications"
                className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Xem tất cả thông báo
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Separate component for notification content to avoid repetition
const NotificationContent: React.FC<{
  notification: INotification
  formatTimeAgo: (date: Date) => string
  getNotificationIcon: (type: string) => string
}> = ({ notification, formatTimeAgo, getNotificationIcon }) => (
  <div className="flex items-start space-x-3">
    <span className="text-lg flex-shrink-0 mt-0.5">
      {getNotificationIcon(notification.type)}
    </span>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium text-gray-900 ${
        !notification.isRead ? 'font-semibold' : ''
      }`}>
        {notification.title}
      </p>
      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
        {notification.message}
      </p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">
          {formatTimeAgo(notification.createdAt)}
        </span>
        {notification.actionText && (
          <span className="text-xs text-blue-600 font-medium">
            {notification.actionText}
          </span>
        )}
      </div>
    </div>
    {!notification.isRead && (
      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
    )}
  </div>
)

export default NotificationIcon
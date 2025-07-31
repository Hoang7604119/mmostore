import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface Notification {
  _id?: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  actionUrl?: string;
  actionText?: string;
  category: 'product' | 'order' | 'account' | 'system' | 'payment';
  metadata?: {
    productId?: string;
    orderId?: string;
    amount?: number;
    [key: string]: any;
  };
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  hasMore: boolean;
}

export function useNotifications(userId?: string | null) {
  const { user } = useAuth();
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0
    },
    hasMore: false
  });

  const fetchNotifications = useCallback(async (page = 1, limit?: number, unreadOnly?: boolean, category?: string, reset = true) => {
    if (!user && !userId) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: (limit || 10).toString()
      });
      
      if (unreadOnly) params.append('unreadOnly', 'true');
      if (category) params.append('category', category);
      
      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setState(prev => {
        let newNotifications;
        if (reset) {
          newNotifications = data.notifications || [];
        } else {
          // When appending (loadMore), filter out duplicates
          const existingIds = new Set(prev.notifications.map((n: Notification) => n._id));
          const uniqueNewNotifications = (data.notifications || []).filter((n: Notification) => !existingIds.has(n._id));
          newNotifications = [...prev.notifications, ...uniqueNewNotifications];
        }
        
        return {
          ...prev,
          notifications: newNotifications,
          unreadCount: data.unreadCount || 0,
          pagination: data.pagination || prev.pagination,
          hasMore: data.hasMore || false,
          loading: false
        };
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false
      }));
    }
  }, [user, userId]);

  const loadMore = async () => {
    if (state.loading || !state.hasMore) return;
    await fetchNotifications(state.pagination.page + 1, undefined, undefined, undefined, false);
  };

  const refresh = async () => {
    await fetchNotifications(1, undefined, undefined, undefined, true);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationIds: [notificationId]
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markAllAsRead: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.map(notif => ({ ...notif, isRead: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const addNotification = (notification: Notification) => {
    setState(prev => {
      // Check if notification already exists to avoid duplicates
      const existingNotification = prev.notifications.find(n => n._id === notification._id);
      if (existingNotification) {
        return prev; // Don't add duplicate
      }
      
      return {
        ...prev,
        notifications: [notification, ...prev.notifications],
        unreadCount: notification.isRead ? prev.unreadCount : prev.unreadCount + 1
      };
    });
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      setState(prev => {
        const notificationToDelete = prev.notifications.find(n => n._id === notificationId);
        return {
          ...prev,
          notifications: prev.notifications.filter(notif => notif._id !== notificationId),
          unreadCount: notificationToDelete && !notificationToDelete.isRead 
            ? Math.max(0, prev.unreadCount - 1) 
            : prev.unreadCount
        };
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  useEffect(() => {
    if (user || userId) {
      fetchNotifications();
    }
  }, [user, userId, fetchNotifications]);

  return {
    ...state,
    fetchNotifications,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    addNotification,
    deleteNotification
  };
}
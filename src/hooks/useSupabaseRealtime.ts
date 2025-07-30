'use client'

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseSupabaseRealtimeProps {
  userId?: string | null
  onNewMessage?: (message: any) => void
  onNewNotification?: (notification: any) => void
  onMessageRead?: (data: any) => void
}

export const useSupabaseRealtime = ({
  userId,
  onNewMessage,
  onNewNotification,
  onMessageRead
}: UseSupabaseRealtimeProps) => {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const userChannelRef = useRef<RealtimeChannel | null>(null)
  const isConnectedRef = useRef(false)

  // Dispatch custom events for components to listen
  const dispatchNewMessage = useCallback((message: any) => {
    // Dispatch to window for global listening
    window.dispatchEvent(new CustomEvent('new-message', { detail: message }))
    // Call local callback if provided
    if (onNewMessage) {
      onNewMessage(message)
    }
  }, [onNewMessage])

  const dispatchNewNotification = useCallback((notification: any) => {
    // Dispatch to window for global listening
    window.dispatchEvent(new CustomEvent('new-notification', { detail: notification }))
    // Call local callback if provided
    if (onNewNotification) {
      onNewNotification(notification)
    }
  }, [onNewNotification])

  const dispatchMessageRead = useCallback((data: any) => {
    // Dispatch to window for global listening
    window.dispatchEvent(new CustomEvent('message-read-update', { detail: data }))
    // Call local callback if provided
    if (onMessageRead) {
      onMessageRead(data)
    }
  }, [onMessageRead])

  // Setup global messages channel
  const setupGlobalChannel = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe()
    }

    const channel = supabase.channel('global-messages')
      .on('broadcast', { event: 'new-message' }, ({ payload }) => {
        console.log('Received new message:', payload)
        dispatchNewMessage(payload)
      })
      .on('broadcast', { event: 'message-read' }, ({ payload }) => {
        console.log('Received message read update:', payload)
        dispatchMessageRead(payload)
      })
      .subscribe((status) => {
        console.log('Global channel status:', status)
        if (status === 'SUBSCRIBED') {
          isConnectedRef.current = true
        }
      })

    channelRef.current = channel
  }, [dispatchNewMessage, dispatchMessageRead])

  // Setup user-specific channel for notifications
  const setupUserChannel = useCallback(() => {
    if (!userId) return

    if (userChannelRef.current) {
      userChannelRef.current.unsubscribe()
    }

    const userChannel = supabase.channel(`user-${userId}`)
      .on('broadcast', { event: 'new-notification' }, ({ payload }) => {
        console.log('Received new notification:', payload)
        dispatchNewNotification(payload)
      })
      .subscribe((status) => {
        console.log('User channel status:', status)
      })

    userChannelRef.current = userChannel
  }, [userId, dispatchNewNotification])

  // Broadcast new message to all clients
  const broadcastNewMessage = useCallback(async (message: any) => {
    if (!channelRef.current) return

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'new-message',
        payload: message
      })
      console.log('Broadcasted new message:', message)
    } catch (error) {
      console.error('Error broadcasting message:', error)
    }
  }, [])

  // Broadcast message read update
  const broadcastMessageRead = useCallback(async (data: any) => {
    if (!channelRef.current) return

    try {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'message-read',
        payload: data
      })
      console.log('Broadcasted message read:', data)
    } catch (error) {
      console.error('Error broadcasting message read:', error)
    }
  }, [])

  // Broadcast new notification to specific user
  const broadcastNewNotification = useCallback(async (notification: any, targetUserId: string) => {
    try {
      const targetChannel = supabase.channel(`user-${targetUserId}`)
      await targetChannel.send({
        type: 'broadcast',
        event: 'new-notification',
        payload: notification
      })
      console.log('Broadcasted notification to user:', targetUserId, notification)
    } catch (error) {
      console.error('Error broadcasting notification:', error)
    }
  }, [])

  // Setup channels on mount and when userId changes
  useEffect(() => {
    setupGlobalChannel()
    setupUserChannel()

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }
      if (userChannelRef.current) {
        userChannelRef.current.unsubscribe()
        userChannelRef.current = null
      }
      isConnectedRef.current = false
    }
  }, [setupGlobalChannel, setupUserChannel])

  return {
    isConnected: isConnectedRef.current,
    broadcastNewMessage,
    broadcastMessageRead,
    broadcastNewNotification
  }
}

export default useSupabaseRealtime
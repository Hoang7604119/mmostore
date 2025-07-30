import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Notification from '@/models/Notification'

// POST - Create multiple notifications at once
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const { notifications } = body
    
    if (!notifications || !Array.isArray(notifications)) {
      return NextResponse.json(
        { error: 'Notifications array is required' },
        { status: 400 }
      )
    }
    
    // Validate each notification
    for (const notification of notifications) {
      const { userId, title, message, category } = notification
      if (!userId || !title || !message || !category) {
        return NextResponse.json(
          { error: 'Each notification must have userId, title, message, and category' },
          { status: 400 }
        )
      }
    }
    
    // Add default values and timestamps
    const notificationsToInsert = notifications.map(notification => ({
      ...notification,
      type: notification.type || 'info',
      isRead: false,
      metadata: notification.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    }))
    
    const result = await Notification.insertMany(notificationsToInsert)
    
    // Send real-time notifications via Socket.io for each created notification
    if (global.io && result.length > 0) {
      try {
        result.forEach(notification => {
          const userId = notification.userId
          // Emit to user's room for NotificationIcon realtime updates
          global.io.to(`user-${userId}`).emit('new-notification', {
            _id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            category: notification.category,
            isRead: notification.isRead,
            actionUrl: notification.actionUrl,
            actionText: notification.actionText,
            createdAt: notification.createdAt,
            metadata: notification.metadata
          })
        })
        console.log(`Socket.io bulk notifications sent for ${result.length} notifications`)
      } catch (socketError) {
        console.error('Failed to send Socket.io bulk notifications:', socketError)
      }
    }
    
    return NextResponse.json({
      success: true,
      insertedCount: result.length,
      notifications: result
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating bulk notifications:', error)
    return NextResponse.json(
      { error: 'Failed to create bulk notifications' },
      { status: 500 }
    )
  }
}
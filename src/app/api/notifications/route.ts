import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Notification from '@/models/Notification'
import { verifyToken } from '@/lib/utils'


export const dynamic = 'force-dynamic'

// GET - Fetch user notifications
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value

    
    if (!token) {
      return NextResponse.json({ error: 'Không có token' }, { status: 401 })
    }

    // Verify token
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: 'Token không hợp lệ' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const userId = decoded.userId // Use user ID from token
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const category = searchParams.get('category')
    
    const query: any = { userId }
    
    if (unreadOnly) {
      query.isRead = false
    }
    
    if (category) {
      query.category = category
    }
    

    
    const skip = (page - 1) * limit
    
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, isRead: false })
    ])
    

    
    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount,
      hasMore: page < Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST - Create new notification
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.json()
    const {
      userId,
      title,
      message,
      type = 'info',
      category,
      actionUrl,
      actionText,
      metadata = {}
    } = body
    
    if (!userId || !title || !message || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      category,
      actionUrl,
      actionText,
      metadata,
      isRead: false
    })
    
    await notification.save()
    
    // Real-time notification is handled by Socket.IO in the sendNotification function

    // Send real-time notification via Socket.io (similar to message system)
    if (global.io) {
      try {
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
        console.log(`Socket.io notification sent to user: ${userId}`)
      } catch (socketError) {
        console.error('Failed to send Socket.io notification:', socketError)
      }
    }
    
    return NextResponse.json({
      success: true,
      notification
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

// PATCH - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    await connectDB()
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Không có token' }, { status: 401 })
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Token không hợp lệ' }, { status: 401 })
    }
    
    const body = await request.json()
    const { notificationIds, markAllAsRead } = body
    const userId = decoded.userId // Use user ID from token
    
    let updateQuery: any = { userId }
    
    if (markAllAsRead) {
      // Mark all notifications as read for the user
      updateQuery = { userId, isRead: false }
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      updateQuery = {
        _id: { $in: notificationIds },
        userId
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }
    
    const result = await Notification.updateMany(
      updateQuery,
      { isRead: true, updatedAt: new Date() }
    )
    
    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount
    })
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Notification from '@/models/Notification'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Debug endpoint để kiểm tra notifications
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify user token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 401 }
      )
    }

    // Get recent notifications for this user
    const notifications = await Notification.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    return NextResponse.json({
      success: true,
      data: {
        userId: decoded.userId,
        totalNotifications: notifications.length,
        notifications: notifications.map(n => ({
          id: n._id,
          title: n.title,
          message: n.message,
          type: n.type,
          category: n.category,
          isRead: n.isRead,
          metadata: n.metadata,
          actionUrl: n.actionUrl,
          actionText: n.actionText,
          createdAt: n.createdAt
        }))
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Debug notifications error:', error)
    return NextResponse.json(
      { error: 'Lỗi debug notifications' },
      { status: 500 }
    )
  }
}
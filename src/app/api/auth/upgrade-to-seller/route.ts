import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { verifyToken } from '@/lib/utils'
import { notifySellerRequestSubmitted, notifyAdminsNewSellerRequest } from '@/utils/notificationHelpers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify token
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

    // Find user
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Check if user is already seller, manager, or admin
    if (['seller', 'manager', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Tài khoản đã có quyền bán hàng' },
        { status: 400 }
      )
    }

    // Check if user already has a pending request
    if (user.sellerRequest && user.sellerRequest.status === 'pending') {
      return NextResponse.json(
        { error: 'Bạn đã có yêu cầu trở thành seller đang chờ duyệt' },
        { status: 400 }
      )
    }

    // Create seller request
    user.sellerRequest = {
      status: 'pending',
      requestedAt: new Date()
    }
    await user.save()

    // Send notification about seller request
    try {
      // Notify the user
      await notifySellerRequestSubmitted(
        decoded.userId,
        user.username
      )
      
      // Notify admins/managers about new seller request
      await notifyAdminsNewSellerRequest(
        user.username,
        user.email,
        decoded.userId
      )
    } catch (notificationError) {
      console.error('Error sending seller request notification:', notificationError)
      // Don't fail the main operation if notification fails
    }

    return NextResponse.json(
      { 
        message: 'Yêu cầu trở thành seller đã được gửi. Vui lòng đợi admin hoặc manager duyệt.',
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          credit: user.credit || 0,
          sellerRequest: user.sellerRequest
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Upgrade to seller error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
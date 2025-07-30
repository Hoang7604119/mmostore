import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/utils'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { notifyRoleChanged } from '@/utils/notificationHelpers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Không có token' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 401 }
      )
    }

    // Get current user (manager/admin)
    const currentUser = await User.findById(decoded.userId)
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Không tìm thấy user' },
        { status: 404 }
      )
    }

    // Check if user is manager or admin
    if (currentUser.role !== 'manager' && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { userId, action, note } = await request.json()

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Hành động không hợp lệ' },
        { status: 400 }
      )
    }

    // Find the user to update
    const targetUser = await User.findById(userId)
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Không tìm thấy user' },
        { status: 404 }
      )
    }

    // Check if user has pending seller request
    if (!targetUser.sellerRequest || targetUser.sellerRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'User không có yêu cầu seller đang chờ duyệt' },
        { status: 400 }
      )
    }

    // Update seller request status
    if (action === 'approve') {
      targetUser.role = 'seller'
      targetUser.sellerRequest.status = 'approved'
    } else {
      targetUser.sellerRequest.status = 'rejected'
    }

    targetUser.sellerRequest.reviewedAt = new Date()
    targetUser.sellerRequest.reviewedBy = currentUser._id
    if (note) {
      targetUser.sellerRequest.note = note
    }

    await targetUser.save()

    // Send notification about role change
    try {
      if (action === 'approve') {
        await notifyRoleChanged(
          targetUser._id.toString(),
          'buyer',
          'seller',
          currentUser.username
        )
      }
    } catch (notificationError) {
      console.error('Error sending role change notification:', notificationError)
      // Don't fail the main operation if notification fails
    }

    const actionText = action === 'approve' ? 'phê duyệt' : 'từ chối'
    
    return NextResponse.json(
      { 
        message: `Đã ${actionText} yêu cầu trở thành seller của ${targetUser.username}`,
        user: {
          _id: targetUser._id,
          username: targetUser.username,
          email: targetUser.email,
          role: targetUser.role,
          sellerRequest: targetUser.sellerRequest
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Handle seller request error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
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

    const { userId, newRole } = await request.json()

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    if (!['buyer', 'seller'].includes(newRole)) {
      return NextResponse.json(
        { error: 'Role không hợp lệ' },
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

    // Prevent changing admin/manager roles
    if (targetUser.role === 'admin' || targetUser.role === 'manager') {
      return NextResponse.json(
        { error: 'Không thể thay đổi quyền của admin/manager' },
        { status: 403 }
      )
    }

    // Prevent self role change
    if (targetUser._id.toString() === currentUser._id.toString()) {
      return NextResponse.json(
        { error: 'Không thể thay đổi quyền của chính mình' },
        { status: 403 }
      )
    }

    const oldRole = targetUser.role
    targetUser.role = newRole

    // If upgrading to seller, update seller request if exists
    if (newRole === 'seller' && targetUser.sellerRequest) {
      targetUser.sellerRequest.status = 'approved'
      targetUser.sellerRequest.reviewedAt = new Date()
      targetUser.sellerRequest.reviewedBy = currentUser._id
      targetUser.sellerRequest.note = 'Được nâng cấp trực tiếp bởi manager'
    }

    // If downgrading from seller, clear seller request
    if (oldRole === 'seller' && newRole === 'buyer') {
      targetUser.sellerRequest = undefined
    }

    await targetUser.save()

    // Send notification about role change
    try {
      await notifyRoleChanged(
        userId,
        oldRole,
        newRole,
        currentUser.username
      )
    } catch (notificationError) {
      console.error('Error sending role change notification:', notificationError)
      // Don't fail the main operation if notification fails
    }

    const actionText = newRole === 'seller' ? 'nâng cấp thành Seller' : 'hạ cấp thành Buyer'
    
    return NextResponse.json(
      { 
        message: `Đã ${actionText} cho user ${targetUser.username}`,
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
    console.error('Change role error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
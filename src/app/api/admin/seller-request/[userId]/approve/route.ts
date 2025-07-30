import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { verifyToken } from '@/lib/utils'
import { notifySellerRequestApproved, notifySellerRequestRejected } from '@/utils/notificationHelpers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { userId: string } }) {
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

    // Find current user to check permissions
    const currentUser = await User.findById(decoded.userId)
    if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { action, note } = await request.json()
    
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Hành động không hợp lệ' },
        { status: 400 }
      )
    }

    // Find the user with seller request
    const user = await User.findById(params.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    if (!user.sellerRequest || user.sellerRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Yêu cầu không hợp lệ hoặc đã được xử lý' },
        { status: 400 }
      )
    }

    // Update seller request
    user.sellerRequest.status = action === 'approve' ? 'approved' : 'rejected'
    user.sellerRequest.reviewedAt = new Date()
    user.sellerRequest.reviewedBy = currentUser._id
    if (note) {
      user.sellerRequest.note = note
    }

    // If approved, upgrade user role to seller
    if (action === 'approve') {
      user.role = 'seller'
    }

    await user.save()

    // Send notification to user
    try {
      if (action === 'approve') {
        await notifySellerRequestApproved(user._id.toString())
      } else {
        await notifySellerRequestRejected(user._id.toString(), note)
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError)
      // Don't fail the main operation if notification fails
    }

    return NextResponse.json(
      { 
        message: action === 'approve' ? 'Đã phê duyệt yêu cầu' : 'Đã từ chối yêu cầu',
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          sellerRequest: user.sellerRequest
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Seller request action error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
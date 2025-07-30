import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { verifyToken } from '@/lib/utils'
import { notifyRoleChanged, notifyAccountStatusChanged } from '@/utils/notificationHelpers'

export const dynamic = 'force-dynamic'

// GET - Lấy danh sách tất cả users (chỉ admin)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify admin token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    // Get all users except passwords
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 })

    return NextResponse.json({ users }, { status: 200 })

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// PUT - Cập nhật role của user (chỉ admin)
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify admin token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { userId, role, isActive } = await request.json()

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID là bắt buộc' },
        { status: 400 }
      )
    }

    if (role && !['admin', 'manager', 'seller', 'buyer'].includes(role)) {
      return NextResponse.json(
        { error: 'Role không hợp lệ' },
        { status: 400 }
      )
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy user' },
        { status: 404 }
      )
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === decoded.userId && role && role !== 'admin') {
      return NextResponse.json(
        { error: 'Không thể thay đổi role của chính mình' },
        { status: 400 }
      )
    }

    // Store old values for notification comparison
    const oldRole = user.role
    const oldIsActive = user.isActive

    // Update user
    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    )

    // Send notifications for changes
    try {
      if (role && role !== oldRole) {
        await notifyRoleChanged(
          userId,
          oldRole,
          role,
          'Admin'
        )
      }
      
      if (isActive !== undefined && isActive !== oldIsActive) {
        await notifyAccountStatusChanged(
          userId,
          isActive ? 'activated' : 'deactivated',
          'Admin'
        )
      }
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError)
      // Don't fail the main operation if notification fails
    }

    return NextResponse.json(
      { 
        message: 'Cập nhật thành công',
        user: updatedUser
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// DELETE - Xóa user (chỉ admin)
export async function DELETE(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify admin token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    // Validation
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID là bắt buộc' },
        { status: 400 }
      )
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy user' },
        { status: 404 }
      )
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === decoded.userId) {
      return NextResponse.json(
        { error: 'Không thể xóa chính mình' },
        { status: 400 }
      )
    }

    // Delete user
    await User.findByIdAndDelete(userId)

    return NextResponse.json(
      { message: 'Xóa user thành công' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
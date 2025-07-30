import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/utils'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    // Get current user
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

    // Get all users except admins (managers can't manage admins)
    const users = await User.find(
      { role: { $ne: 'admin' } }
    ).select('-password').sort({ createdAt: -1 })

    return NextResponse.json(
      { 
        users,
        message: 'Lấy danh sách user thành công'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
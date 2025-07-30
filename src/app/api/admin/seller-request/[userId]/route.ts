import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { verifyToken } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
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

    // Find the user with seller request
    const user = await User.findById(params.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    if (!user.sellerRequest) {
      return NextResponse.json(
        { error: 'Người dùng chưa gửi yêu cầu trở thành seller' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
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
    console.error('Get seller request error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { verifyToken } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET - Tìm kiếm người dùng
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự' },
        { status: 400 }
      )
    }

    // Search users by username or email
    const searchRegex = new RegExp(query.trim(), 'i')
    const users = await User.find({
      $or: [
        { username: { $regex: searchRegex } },
        { email: { $regex: searchRegex } }
      ],
      // Exclude the current user
      _id: { $ne: decoded.userId }
    })
    .select('_id username email')
    .limit(limit)
    .lean()

    return NextResponse.json({
      users,
      total: users.length
    }, { status: 200 })

  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
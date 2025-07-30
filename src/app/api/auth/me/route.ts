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

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy user' },
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
          isActive: user.isActive,
          credit: user.credit || 0,
          sellerRequest: user.sellerRequest
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
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
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy user' },
        { status: 404 }
      )
    }

    // Check if user is seller
    if (user.role !== 'seller') {
      return NextResponse.json(
        { error: 'Chỉ seller mới có thể xem thống kê' },
        { status: 403 }
      )
    }

    // TODO: Implement actual statistics calculation
    // For now, return mock data
    const stats = {
      totalProducts: 0,
      totalSales: 0,
      totalRevenue: 0,
      averageRating: 0,
      totalViews: 0,
      pendingOrders: 0
    }

    // In a real implementation, you would:
    // 1. Count products created by this seller
    // 2. Count completed orders for this seller's products
    // 3. Calculate total revenue from completed orders
    // 4. Calculate average rating from product reviews
    // 5. Sum up product views
    // 6. Count pending orders

    return NextResponse.json(
      { 
        stats
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Get seller stats error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
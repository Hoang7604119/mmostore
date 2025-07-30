import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Không tìm thấy token xác thực' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    
    // Connect to database
    await connectDB()
    
    // Get user info
    const user = await User.findById(decoded.userId).select('role')

    if (!user) {
      return NextResponse.json(
        { error: 'Người dùng không tồn tại' },
        { status: 404 }
      )
    }

    if (user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Chỉ người mua mới có thể truy cập thống kê này' },
        { status: 403 }
      )
    }

    // TODO: Replace with actual database queries
    // For now, return mock data
    const stats = {
      totalOrders: 15,
      totalSpent: 2500000, // 2.5M VND
      favoriteProducts: 8,
      reviewsGiven: 12,
      averageOrderValue: 166667, // totalSpent / totalOrders
      loyaltyPoints: 250
    }

    // TODO: Implement actual queries like:
    // const totalOrders = await prisma.order.count({
    //   where: { buyerId: user.id }
    // })
    // 
    // const totalSpentResult = await prisma.order.aggregate({
    //   where: { buyerId: user.id, status: 'completed' },
    //   _sum: { total: true }
    // })
    // 
    // const favoriteProducts = await prisma.wishlist.count({
    //   where: { userId: user.id }
    // })
    // 
    // const reviewsGiven = await prisma.review.count({
    //   where: { userId: user.id }
    // })

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Get buyer stats error:', error)
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { status: 500 }
    )
  }
}
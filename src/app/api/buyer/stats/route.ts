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

    // Import required models
    const Order = (await import('@/models/Order')).default
    const Review = (await import('@/models/Review')).default

    // Get actual buyer statistics from database
    const userId = decoded.userId

    // Count total orders
    const totalOrders = await Order.countDocuments({ buyerId: userId })

    // Calculate total spent (only completed orders)
    const totalSpentResult = await Order.aggregate([
      {
        $match: {
          buyerId: new (await import('mongoose')).Types.ObjectId(userId),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: '$totalAmount' }
        }
      }
    ])
    const totalSpent = totalSpentResult.length > 0 ? totalSpentResult[0].totalSpent : 0

    // Count reviews given by this buyer
    const reviewsGiven = await Review.countDocuments({ userId: userId })

    // Calculate average order value
    const averageOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0

    // For now, set favoriteProducts and loyaltyPoints to 0 as requested
    // These features will be implemented later
    const favoriteProducts = 0
    const loyaltyPoints = 0

    const stats = {
      totalOrders,
      totalSpent,
      favoriteProducts,
      reviewsGiven,
      averageOrderValue,
      loyaltyPoints
    }

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
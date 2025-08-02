import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Product from '@/models/Product'
import Order from '@/models/Order'
import Report from '@/models/Report'

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

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Chỉ quản trị viên mới có thể truy cập thống kê này' },
        { status: 403 }
      )
    }

    // Get real statistics from database
    const [totalUsers, totalSellers, totalBuyers, totalProducts, totalOrders] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'buyer' }),
      Product.countDocuments(),
      Order.countDocuments()
    ])
    
    // Get total revenue from completed orders
    const totalRevenueResult = await Order.aggregate([
      {
        $match: {
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ])
    
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0
    
    // Get pending reports
    const activeReports = await Report.countDocuments({ status: 'pending' })
    
    // Calculate system health based on various metrics
    let systemHealth: 'good' | 'warning' | 'critical' = 'good'
    
    // Warning conditions
    if (activeReports > 10) {
      systemHealth = 'warning'
    }
    
    // Critical conditions
    if (activeReports > 50) {
      systemHealth = 'critical'
    }
    
    const stats = {
      totalUsers,
      totalSellers,
      totalBuyers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingSellerRequests: 0, // This would need a separate SellerRequest model
      activeReports,
      systemHealth
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Get admin stats error:', error)
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { status: 500 }
    )
  }
}
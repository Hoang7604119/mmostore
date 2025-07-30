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

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Chỉ quản trị viên mới có thể truy cập thống kê này' },
        { status: 403 }
      )
    }

    // TODO: Replace with actual database queries
    // For now, return mock data
    const stats = {
      totalUsers: 1247,
      totalSellers: 89,
      totalBuyers: 1158,
      totalProducts: 3456,
      totalOrders: 2891,
      totalRevenue: 125000000, // 125M VND
      pendingSellerRequests: 5,
      activeReports: 3,
      systemHealth: 'good' as const
    }

    // TODO: Implement actual queries like:
    // const totalUsers = await prisma.user.count()
    // 
    // const totalSellers = await prisma.user.count({
    //   where: { role: 'seller' }
    // })
    // 
    // const totalBuyers = await prisma.user.count({
    //   where: { role: 'buyer' }
    // })
    // 
    // const totalProducts = await prisma.product.count()
    // 
    // const totalOrders = await prisma.order.count()
    // 
    // const totalRevenueResult = await prisma.order.aggregate({
    //   where: { status: 'completed' },
    //   _sum: { total: true }
    // })
    // 
    // const pendingSellerRequests = await prisma.sellerRequest.count({
    //   where: { status: 'pending' }
    // })
    // 
    // const activeReports = await prisma.report.count({
    //   where: { status: 'pending' }
    // })

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
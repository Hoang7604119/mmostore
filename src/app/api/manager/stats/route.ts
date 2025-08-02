import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { verifyToken } from '@/lib/utils'
import Product from '@/models/Product'
import User from '@/models/User'
import Order from '@/models/Order'
import Report from '@/models/Report'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Check authentication
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'manager') {
      return NextResponse.json({ error: 'Chỉ quản lý mới có thể truy cập thống kê này' }, { status: 403 })
    }

    // Get comprehensive manager statistics
    const [pendingProducts, approvedProducts, rejectedProducts, totalProducts] = await Promise.all([
      Product.countDocuments({ status: 'pending' }),
      Product.countDocuments({ status: 'approved' }),
      Product.countDocuments({ status: 'rejected' }),
      Product.countDocuments()
    ])

    // Get user statistics
    const managedSellers = await User.countDocuments({ role: 'seller' })
    
    // Get order statistics
    const totalOrders = await Order.countDocuments()
    
    // Get monthly revenue (current month)
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    
    const monthlyRevenueResult = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: currentMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ])
    
    const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].totalRevenue : 0
    
    // Get pending reports (as pending tasks for manager)
    const pendingReports = await Report.countDocuments({ status: 'pending' })
    
    // Get completed reports this month (as completed tasks)
    const completedReports = await Report.countDocuments({
      status: 'resolved',
      resolvedAt: { $gte: currentMonth }
    })
    
    const stats = {
      managedSellers,
      managedProducts: totalProducts,
      pendingProducts,
      approvedProducts,
      rejectedProducts,
      totalOrders,
      monthlyRevenue,
      pendingSellerRequests: 0, // This would need a separate SellerRequest model
      completedTasks: completedReports,
      pendingTasks: pendingReports + pendingProducts // Reports + pending products
    }

    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Get manager stats error:', error)
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { status: 500 }
    )
  }
}
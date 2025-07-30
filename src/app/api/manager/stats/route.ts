import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { verifyToken } from '@/lib/utils'
import Product from '@/models/Product'
import User from '@/models/User'

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
    
    // TODO: Replace with actual database queries when order system is implemented
    // For now, return mock data for missing fields
    const stats = {
      managedSellers,
      managedProducts: totalProducts,
      pendingProducts,
      approvedProducts,
      rejectedProducts,
      totalOrders: 1234, // Mock data
      monthlyRevenue: 45000000, // Mock data - 45M VND
      pendingSellerRequests: 8, // Mock data
      completedTasks: 156, // Mock data
      pendingTasks: 12 // Mock data
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
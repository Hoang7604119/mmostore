import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/utils'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

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



    // Check if user has seller permissions
    if (!['seller', 'manager', 'admin'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    // Use direct mongoose query to avoid model registration issues
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }
    const productsCollection = db.collection('products')
    const ordersCollection = db.collection('orders')
    
    const sellerId = new mongoose.Types.ObjectId(decoded.userId)

    // Get products statistics
    const productStats = await productsCollection.aggregate([
      {
        $match: {
          sellerId: sellerId
        }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          pendingProducts: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          approvedProducts: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
            }
          },
          rejectedProducts: {
            $sum: {
              $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0]
            }
          },
          totalSoldCount: { $sum: '$soldCount' },
          averageRating: { $avg: '$rating' }
        }
      }
    ]).toArray()

    const productData = productStats[0] || {
      totalProducts: 0,
      pendingProducts: 0,
      approvedProducts: 0,
      rejectedProducts: 0,
      totalSoldCount: 0,
      averageRating: 0
    }

    // Get orders statistics
    const orderStats = await ordersCollection.aggregate([
      {
        $match: {
          sellerId: sellerId
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          completedRevenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0]
            }
          }
        }
      }
    ]).toArray()

    const orderData = orderStats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      completedOrders: 0,
      completedRevenue: 0
    }

    // Calculate additional metrics
    const averageOrderValue = orderData.completedOrders > 0 
      ? Math.round(orderData.completedRevenue / orderData.completedOrders)
      : 0
    
    const conversionRate = productData.approvedProducts > 0
      ? Math.round((orderData.totalOrders / productData.approvedProducts) * 100 * 10) / 10
      : 0

    const stats = {
      totalProducts: productData.totalProducts,
      pendingProducts: productData.pendingProducts,
      approvedProducts: productData.approvedProducts,
      rejectedProducts: productData.rejectedProducts,
      totalSoldCount: productData.totalSoldCount,
      averageRating: Math.round((productData.averageRating || 0) * 10) / 10, // Round to 1 decimal
      totalOrders: orderData.totalOrders,
      completedOrders: orderData.completedOrders,
      totalRevenue: orderData.totalRevenue,
      completedRevenue: orderData.completedRevenue,
      averageOrderValue: averageOrderValue,
      conversionRate: conversionRate // Orders per approved product
    }

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
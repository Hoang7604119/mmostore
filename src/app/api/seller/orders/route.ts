import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { verifyToken } from '@/lib/utils'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Ensure database connection
    await connectDB()
    
    // Verify seller token
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const productId = searchParams.get('productId')
    
    const skip = (page - 1) * limit

    // Build filter criteria
    const filter: any = {
      sellerId: new mongoose.Types.ObjectId(decoded.userId)
    }
    
    if (status) {
      filter.status = status
    }
    
    if (productId) {
      filter.productId = new mongoose.Types.ObjectId(productId)
    }

    // Use direct mongoose query to avoid model registration issues
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      )
    }
    const ordersCollection = db.collection('orders')
    
    // Get orders
    const orders = await ordersCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    // Convert ObjectIds to strings for JSON serialization
    const ordersWithStringIds = orders.map(order => ({
      ...order,
      _id: order._id.toString(),
      buyerId: order.buyerId.toString(),
      sellerId: order.sellerId.toString(),
      productId: order.productId.toString(),
      accountItems: order.accountItems?.map((id: any) => id.toString()) || []
    }))

    // Get total count for pagination
    const total = await ordersCollection.countDocuments(filter)
    const totalPages = Math.ceil(total / limit)

    // Calculate summary statistics
    const summaryPipeline = [
      {
        $match: {
          sellerId: new mongoose.Types.ObjectId(decoded.userId)
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]
    
    const summaryResult = await ordersCollection.aggregate(summaryPipeline).toArray()
    
    const summary = {
      pending: { count: 0, totalAmount: 0 },
      completed: { count: 0, totalAmount: 0 },
      cancelled: { count: 0, totalAmount: 0 },
      refunded: { count: 0, totalAmount: 0 }
    }
    
    summaryResult.forEach((item: any) => {
      if (summary[item._id as keyof typeof summary]) {
        summary[item._id as keyof typeof summary] = {
          count: item.count,
          totalAmount: item.totalAmount
        }
      }
    })

    // Calculate total summary
    const totalSummary = {
      count: summary.pending.count + summary.completed.count + summary.cancelled.count + summary.refunded.count,
      amount: summary.pending.totalAmount + summary.completed.totalAmount + summary.cancelled.totalAmount + summary.refunded.totalAmount
    }

    const summaryWithTotal = {
      ...summary,
      total: totalSummary
    }

    return NextResponse.json({
      success: true,
      data: {
        orders: ordersWithStringIds,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        summary: summaryWithTotal
      }
    })

  } catch (error) {
    console.error('Error fetching seller orders:', error)
    return NextResponse.json(
      { error: 'Lỗi server nội bộ' },
      { status: 500 }
    )
  }
}
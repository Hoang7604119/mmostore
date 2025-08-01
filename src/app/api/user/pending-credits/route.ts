import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { verifyToken } from '@/lib/utils'
import { PENDING_CREDIT_STATUS } from '@/constants/credit'
import mongoose from 'mongoose'
// Import models to ensure they are registered
import Order from '@/models/Order'
import PendingCredit from '@/models/PendingCredit'

export const dynamic = 'force-dynamic'

// GET /api/user/pending-credits - Lấy danh sách credit đang bị giam giữ của user
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Ensure Order model is registered
    if (!mongoose.models.Order) {
      require('@/models/Order')
    }
    
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
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') // 'pending', 'released', 'cancelled'
    
    const skip = (page - 1) * limit
    
    // Build filter criteria
    const filter: any = {
      userId: new mongoose.Types.ObjectId(decoded.userId)
    }
    
    if (status && Object.values(PENDING_CREDIT_STATUS).includes(status as any)) {
      filter.status = status
    }
    
    // Get pending credits with pagination and populate order info
    const pendingCredits = await PendingCredit.find(filter)
      .populate({
        path: 'orderId',
        select: 'orderNumber totalAmount',
        model: 'Order'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    // Get total count for pagination
    const total = await PendingCredit.countDocuments(filter)
    
    // Calculate summary statistics
    const summary = await PendingCredit.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(decoded.userId)
        }
      },
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ])
    
    // Format summary for easier use
    const summaryFormatted = {
      pending: { amount: 0, count: 0 },
      released: { amount: 0, count: 0 },
      cancelled: { amount: 0, count: 0 }
    }
    
    summary.forEach(item => {
      if (item._id in summaryFormatted) {
        summaryFormatted[item._id as keyof typeof summaryFormatted] = {
          amount: item.totalAmount,
          count: item.count
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        pendingCredits,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        summary: summaryFormatted
      }
    })
    
  } catch (error) {
    console.error('Get pending credits error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
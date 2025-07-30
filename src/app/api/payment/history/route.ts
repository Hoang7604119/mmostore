import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Lấy lịch sử thanh toán của người dùng
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify user token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
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
    const status = searchParams.get('status')
    
    // Build query
    const query: any = { userId: decoded.userId }
    if (status && status !== 'all') {
      query.status = status
    }

    // Get payments with pagination
    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()

    // Get total count
    const total = await Payment.countDocuments(query)

    // Format response
    const formattedPayments = payments.map(payment => ({
      id: payment._id,
      orderCode: payment.orderCode,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      description: payment.description,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Get payment history error:', error)
    return NextResponse.json(
      { error: 'Lỗi lấy lịch sử thanh toán' },
      { status: 500 }
    )
  }
}
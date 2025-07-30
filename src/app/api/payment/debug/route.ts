import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import User from '@/models/User'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Debug endpoint để kiểm tra payment records
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

    // Get user info
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Người dùng không tồn tại' },
        { status: 404 }
      )
    }

    // Get recent payments for this user
    const payments = await Payment.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          credit: user.credit
        },
        payments: payments.map(p => ({
          orderCode: p.orderCode,
          amount: p.amount,
          status: p.status,
          paymentMethod: p.paymentMethod,
          transactionId: p.transactionId,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        }))
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Debug payment error:', error)
    return NextResponse.json(
      { error: 'Lỗi debug payment' },
      { status: 500 }
    )
  }
}
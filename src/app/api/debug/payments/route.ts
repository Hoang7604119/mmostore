import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import User from '@/models/User'

export const dynamic = 'force-dynamic'

// GET - Public debug endpoint để kiểm tra payment records
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Get recent payments
    const payments = await Payment.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'username email credit')
      .lean()

    return NextResponse.json({
      success: true,
      data: {
        totalPayments: payments.length,
        payments: payments.map(p => ({
          orderCode: p.orderCode,
          amount: p.amount,
          status: p.status,
          paymentMethod: p.paymentMethod,
          transactionId: p.transactionId,
          user: p.userId ? {
            username: (p.userId as any).username,
            email: (p.userId as any).email,
            credit: (p.userId as any).credit
          } : null,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        }))
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Debug payments error:', error)
    return NextResponse.json(
      { error: 'Lỗi debug payments' },
      { status: 500 }
    )
  }
}
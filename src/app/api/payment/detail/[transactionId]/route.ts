import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Payment from '@/models/Payment'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Lấy chi tiết giao dịch theo ID
export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
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

    const { transactionId } = params
    
    // Find payment by ID and ensure it belongs to the current user
    const payment = await Payment.findOne({
      _id: transactionId,
      userId: decoded.userId
    }).lean() as any

    if (!payment) {
      return NextResponse.json(
        { error: 'Giao dịch không tồn tại hoặc bạn không có quyền truy cập' },
        { status: 404 }
      )
    }

    // Format response
    const formattedPayment = {
      id: payment._id,
      orderCode: payment.orderCode,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      description: payment.description,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt
    }

    return NextResponse.json({
      success: true,
      data: formattedPayment
    }, { status: 200 })

  } catch (error) {
    console.error('Get payment detail error:', error)
    return NextResponse.json(
      { error: 'Lỗi lấy chi tiết giao dịch' },
      { status: 500 }
    )
  }
}
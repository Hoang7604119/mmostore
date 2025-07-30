import { NextRequest, NextResponse } from 'next/server'
import { payOS } from '@/config/payos'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import { notifyCreditAdded, notifyPaymentReceived } from '@/utils/notificationHelpers'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST - Đồng bộ trạng thái thanh toán từ PayOS (giải pháp tạm thời khi webhook không hoạt động)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify admin token (chỉ admin mới có thể sync)
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

    // Get user info to check role
    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Chỉ admin mới có thể thực hiện sync' },
        { status: 403 }
      )
    }

    const { orderCode } = await request.json()
    
    if (!orderCode) {
      return NextResponse.json(
        { error: 'orderCode is required' },
        { status: 400 }
      )
    }
    
    console.log('Syncing payment status for orderCode:', orderCode)
    
    // Find payment record
    const payment = await Payment.findOne({ orderCode })
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      )
    }
    
    // Skip if already paid
    if (payment.status === 'paid') {
      return NextResponse.json(
        { success: true, message: 'Payment already processed', data: { orderCode, status: 'paid' } },
        { status: 200 }
      )
    }
    
    // Get payment info from PayOS
    let paymentInfo
    try {
      paymentInfo = await payOS.getPaymentLinkInformation(parseInt(orderCode.toString()))
    } catch (payosError: any) {
      console.error('PayOS API error:', payosError)
      return NextResponse.json(
        { error: 'Không thể lấy thông tin từ PayOS: ' + payosError.message },
        { status: 500 }
      )
    }
    
    console.log('PayOS payment info:', paymentInfo)
    
    // Check if payment is successful on PayOS
    if (paymentInfo.status === 'PAID') {
      // Find user
      const paymentUser = await User.findById(payment.userId)
      if (!paymentUser) {
        return NextResponse.json(
          { error: 'User not found for payment' },
          { status: 404 }
        )
      }

      // Update payment status
      payment.status = 'paid'
      payment.transactionId = 'SYNC_' + Date.now()
      await payment.save()
      
      console.log('Payment updated:', { orderCode, status: 'paid', transactionId: payment.transactionId })

      // Update user credit
      const previousCredit = paymentUser.credit || 0
      paymentUser.credit = previousCredit + payment.amount
      await paymentUser.save()
      
      console.log('User credit updated:', {
        userId: paymentUser._id,
        username: paymentUser.username,
        previousCredit,
        amount: payment.amount,
        newCredit: paymentUser.credit
      })

      // Send notifications
      try {
        await notifyPaymentReceived(paymentUser._id.toString(), payment.amount, 'PayOS', payment.transactionId)
        await notifyCreditAdded(paymentUser._id.toString(), payment.amount, 'PayOS', paymentUser.credit)
      } catch (notificationError) {
        console.error('Notification error:', notificationError)
        // Don't fail the sync if notification fails
      }

      console.log(`Payment synced successfully for user ${paymentUser.username}: +${payment.amount} VNĐ (Order: ${orderCode})`)
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Payment synced successfully',
          data: {
            orderCode,
            amount: payment.amount,
            previousCredit,
            newCredit: paymentUser.credit,
            username: paymentUser.username
          }
        },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Payment not completed on PayOS',
          data: {
            orderCode,
            payosStatus: paymentInfo.status,
            localStatus: payment.status
          }
        },
        { status: 200 }
      )
    }

  } catch (error) {
    console.error('Sync payment error:', error)
    return NextResponse.json(
      { error: 'Sync payment failed: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// GET - Lấy danh sách payments cần sync
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify admin token
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

    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Chỉ admin mới có thể xem danh sách sync' },
        { status: 403 }
      )
    }

    // Get pending payments from last 24 hours
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const pendingPayments = await Payment.find({
      status: 'pending',
      paymentMethod: 'payos',
      createdAt: { $gte: yesterday }
    })
    .populate('userId', 'username email')
    .sort({ createdAt: -1 })
    .lean()

    return NextResponse.json({
      success: true,
      data: {
        totalPending: pendingPayments.length,
        payments: pendingPayments.map(p => ({
          orderCode: p.orderCode,
          amount: p.amount,
          status: p.status,
          user: p.userId ? {
            username: (p.userId as any).username,
            email: (p.userId as any).email
          } : null,
          createdAt: p.createdAt
        }))
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Get pending payments error:', error)
    return NextResponse.json(
      { error: 'Lỗi lấy danh sách payments' },
      { status: 500 }
    )
  }
}
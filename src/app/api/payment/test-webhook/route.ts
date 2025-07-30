import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import { notifyCreditAdded, notifyPaymentReceived } from '@/utils/notificationHelpers'

export const dynamic = 'force-dynamic'

// POST - Test webhook để kiểm tra logic xử lý thanh toán
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { orderCode } = await request.json()
    
    if (!orderCode) {
      return NextResponse.json(
        { error: 'orderCode is required' },
        { status: 400 }
      )
    }
    
    console.log('Testing webhook for orderCode:', orderCode)
    
    // Find payment record by orderCode to get userId
    const payment = await Payment.findOne({ orderCode })
    if (!payment) {
      console.error('Payment record not found:', orderCode)
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      )
    }
    
    console.log('Payment found:', payment)
    
    // Find user by userId from payment record
    const user = await User.findById(payment.userId)
    if (!user) {
      console.error('User not found for payment:', orderCode)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    console.log('User found:', { id: user._id, username: user.username, currentCredit: user.credit })

    // Update payment status
    payment.status = 'paid'
    payment.transactionId = 'TEST_' + Date.now()
    await payment.save()
    
    console.log('Payment updated:', { orderCode, status: 'paid', transactionId: payment.transactionId })

    // Update user credit
    const previousCredit = user.credit || 0
    const amount = payment.amount
    user.credit = previousCredit + amount
    await user.save()
    
    console.log('User credit updated:', {
      userId: user._id,
      username: user.username,
      previousCredit,
      amount,
      newCredit: user.credit
    })

    // Send notifications
    try {
      await notifyPaymentReceived(user._id.toString(), amount, 'PayOS', payment.transactionId || orderCode.toString())
      
      await notifyCreditAdded(user._id.toString(), amount, 'PayOS', user.credit)
      
      console.log('Notifications sent successfully')
    } catch (notificationError) {
      console.error('Notification error:', notificationError)
    }

    console.log(`Payment test successful for user ${user.username}: +${amount} VNĐ (Order: ${orderCode})`)
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Payment test processed successfully',
        data: {
          orderCode,
          amount,
          previousCredit,
          newCredit: user.credit,
          username: user.username
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Test webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
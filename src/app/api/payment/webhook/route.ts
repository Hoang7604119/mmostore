import { NextRequest, NextResponse } from 'next/server'
import { payOS } from '@/config/payos'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import { notifyCreditAdded, notifyPaymentReceived } from '@/utils/notificationHelpers'

export const dynamic = 'force-dynamic'

// POST - Xử lý webhook từ PayOS
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const body = await request.text()
    const webhookData = JSON.parse(body)
    
    console.log('Webhook received:', JSON.stringify(webhookData, null, 2))
    
    // Verify webhook signature
    const isValidSignature = payOS.verifyPaymentWebhookData(webhookData)
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const { data } = webhookData
    
    // Check if payment is successful
    if (data.code === '00' && data.desc === 'success') {
      const { orderCode, amount, description } = data
      
      // Find payment record by orderCode to get userId
      const payment = await Payment.findOne({ orderCode })
      if (!payment) {
        console.error('Payment record not found:', orderCode)
        return NextResponse.json(
          { error: 'Payment record not found' },
          { status: 404 }
        )
      }
      
      // Find user by userId from payment record
      const user = await User.findById(payment.userId)
      if (!user) {
        console.error('User not found for payment:', orderCode)
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Update payment status
      payment.status = 'paid'
      payment.transactionId = data.transactionDateTime || data.id
      await payment.save()
      
      console.log('Payment updated:', { orderCode, status: 'paid', transactionId: payment.transactionId })

      // Update user credit
      const previousCredit = user.credit || 0
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
        await notifyPaymentReceived(user._id.toString(), amount, 'PayOS', data.transactionDateTime || data.id || orderCode.toString())
        
        await notifyCreditAdded(user._id.toString(), amount, 'PayOS', user.credit)
      } catch (notificationError) {
        console.error('Notification error:', notificationError)
        // Don't fail the webhook if notification fails
      }

      console.log(`Payment successful for user ${user.username}: +${amount} VNĐ (Order: ${orderCode})`)
      
      return NextResponse.json(
        { success: true, message: 'Payment processed successfully' },
        { status: 200 }
      )
    } else {
      console.log('Payment failed or cancelled:', data)
      return NextResponse.json(
        { success: true, message: 'Payment failed or cancelled' },
        { status: 200 }
      )
    }

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// GET - Health check for webhook endpoint
export async function GET() {
  return NextResponse.json(
    { message: 'PayOS webhook endpoint is active' },
    { status: 200 }
  )
}
import { NextRequest, NextResponse } from 'next/server'
import { payOS } from '@/config/payos'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import { notifyCreditAdded, notifyPaymentReceived } from '@/utils/notificationHelpers'
import * as crypto from 'crypto'

export const dynamic = 'force-dynamic'

function sortObjDataByKey(object: any): any {
  const orderedObject = Object.keys(object)
    .sort()
    .reduce((obj: any, key: string) => {
      obj[key] = object[key];
      return obj;
    }, {});
  return orderedObject;
}

function convertObjToQueryStr(object: any): string {
  return Object.keys(object)
    .filter((key) => object[key] !== undefined)
    .map((key) => {
      let value = object[key];
      // Sort nested object
      if (value && Array.isArray(value)) {
        value = JSON.stringify(value.map((val: any) => sortObjDataByKey(val)));
      }
      // Set empty string if null
      if ([null, undefined, 'undefined', 'null'].includes(value)) {
        value = '';
      }

      return `${key}=${value}`;
    })
    .join('&');
}

function createPayOSSignature(data: any, checksumKey: string): string {
  const sortedDataByKey = sortObjDataByKey(data);
  const dataQueryStr = convertObjToQueryStr(sortedDataByKey);
  
  const signature = crypto.createHmac('sha256', checksumKey)
    .update(dataQueryStr)
    .digest('hex');
  
  console.log('Calculated signature:', signature);
  return signature;
}

function isValidData(data: any, currentSignature: string, checksumKey: string): boolean {
  const sortedDataByKey = sortObjDataByKey(data);
  const dataQueryStr = convertObjToQueryStr(sortedDataByKey);
  const dataToSignature = crypto.createHmac('sha256', checksumKey).update(dataQueryStr).digest('hex');
  return dataToSignature === currentSignature;
}

// POST - Xử lý webhook từ PayOS
export async function POST(request: NextRequest) {
  // Log webhook với timestamp để debug
  const timestamp = new Date().toISOString()
  let webhookData: any = null
  
  try {
    await connectDB()
    
    const body = await request.text()
    console.log(`[${timestamp}] Raw body:`, body)
    
    // Handle empty body (for endpoint validation)
    if (!body || body.trim() === '') {
      console.log(`[${timestamp}] Empty body received - likely endpoint validation`)
      return NextResponse.json(
        { 
          message: 'PayOS webhook endpoint is active',
          timestamp: new Date().toISOString(),
          status: 'ok'
        },
        { status: 200 }
      )
    }
    
    try {
      webhookData = JSON.parse(body)
    } catch (parseError) {
      console.error(`[${timestamp}] JSON parse error:`, parseError)
      return NextResponse.json(
        { 
          message: 'PayOS webhook endpoint is active',
          timestamp: new Date().toISOString(),
          error: 'Invalid JSON payload'
        },
        { status: 200 }
      )
    }
    
    console.log(`[${timestamp}] PayOS Webhook received:`, JSON.stringify(webhookData, null, 2))
    console.log(`[${timestamp}] Request headers:`, Object.fromEntries(request.headers.entries()))
    console.log(`[${timestamp}] Request URL:`, request.url)
    
    // Check if this is a PayOS validation request
    if (webhookData.test === true || (typeof webhookData === 'object' && Object.keys(webhookData).length === 1 && webhookData.test)) {
      console.log(`[${timestamp}] PayOS validation request detected - responding with success`)
      return NextResponse.json(
        { 
          message: 'PayOS webhook endpoint validated successfully',
          timestamp: new Date().toISOString(),
          status: 'ok'
        },
        { status: 200 }
      )
    }
    
    // Verify webhook signature theo chuẩn PayOS cho real webhook data
    let isValidSignature = false
    try {
      // Sử dụng PayOS SDK để verify
      const verifiedData = payOS.verifyPaymentWebhookData(webhookData)
      isValidSignature = !!verifiedData
      console.log(`[${timestamp}] Signature verification result:`, isValidSignature)
    } catch (error) {
      console.error(`[${timestamp}] Signature verification error:`, error)
      
      // Fallback: Manual signature verification following PayOS documentation
        try {
          const { signature, ...dataToVerify } = webhookData
          
          if (signature && dataToVerify.data) {
            // Xác minh chữ ký thủ công theo chuẩn PayOS
            isValidSignature = isValidData(dataToVerify.data, signature, process.env.PAYOS_CHECKSUM_KEY || 'a51e671a08b1b5356eb2294b823851cf0d21659bbe11bf43c0d3479f55ed21a3')
            
            console.log(`[${timestamp}] Manual signature verification:`, {
              received: signature,
              valid: isValidSignature
            })
          }
        } catch (manualError) {
          console.error(`[${timestamp}] Manual signature verification failed:`, manualError)
        }
    }
    
    if (!isValidSignature) {
      console.error(`[${timestamp}] Invalid webhook signature - rejecting request`)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const { data } = webhookData
    console.log(`[${timestamp}] Processing webhook data:`, JSON.stringify(data, null, 2))
    
    // Check if payment is successful
    if (data.code === '00' && (data.desc === 'success' || data.desc === 'Thành công')) {
      const { orderCode, amount, description, reference, transactionDateTime } = data
      
      console.log(`[${timestamp}] Payment successful - OrderCode: ${orderCode}, Amount: ${amount}`)
      
      // Find payment record by orderCode to get userId
      const payment = await Payment.findOne({ orderCode })
      if (!payment) {
        console.error(`[${timestamp}] Payment record not found for orderCode:`, orderCode)
        console.log(`[${timestamp}] Available payments:`, await Payment.find({}, 'orderCode status userId').limit(10))
        return NextResponse.json(
          { error: 'Payment record not found' },
          { status: 404 }
        )
      }
      
      // Kiểm tra nếu payment đã được xử lý
      if (payment.status === 'paid') {
        console.log(`[${timestamp}] Payment already processed for orderCode:`, orderCode)
        return NextResponse.json(
          { success: true, message: 'Payment already processed' },
          { status: 200 }
        )
      }
      
      // Find user by userId from payment record
      const user = await User.findById(payment.userId)
      if (!user) {
        console.error(`[${timestamp}] User not found for payment:`, {
          orderCode,
          userId: payment.userId,
          paymentId: payment._id
        })
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      console.log(`[${timestamp}] Found user:`, {
        userId: user._id,
        username: user.username,
        currentCredit: user.credit || 0
      })

      // Update payment status với transaction details
      payment.status = 'paid'
      payment.transactionId = reference || transactionDateTime || data.id || `payos_${orderCode}`
      payment.paidAt = new Date()
      payment.paymentMethod = 'PayOS'
      payment.transactionData = {
        reference,
        transactionDateTime,
        accountNumber: data.accountNumber,
        description: data.description
      }
      await payment.save()
      
      console.log(`[${timestamp}] Payment updated:`, {
        orderCode,
        status: 'paid',
        transactionId: payment.transactionId,
        paidAt: payment.paidAt
      })

      // Update user credit với atomic operation
      const previousCredit = user.credit || 0
      const newCredit = previousCredit + amount
      
      // Sử dụng findByIdAndUpdate để tránh race condition
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $inc: { credit: amount } },
        { new: true }
      )
      
      console.log(`[${timestamp}] User credit updated:`, {
        userId: user._id,
        username: user.username,
        previousCredit,
        amount,
        newCredit: updatedUser.credit,
        transactionId: payment.transactionId
      })

      // Send notifications
      try {
        await notifyPaymentReceived(
          user._id.toString(), 
          amount, 
          'PayOS', 
          payment.transactionId
        )
        
        await notifyCreditAdded(
          user._id.toString(), 
          amount, 
          'PayOS', 
          updatedUser.credit
        )
        
        console.log(`[${timestamp}] Notifications sent successfully`)
      } catch (notificationError) {
        console.error(`[${timestamp}] Notification error:`, notificationError)
        // Don't fail the webhook if notification fails
      }

      console.log(`[${timestamp}] ✅ Payment processed successfully:`, {
        user: user.username,
        amount: `+${amount} VNĐ`,
        orderCode,
        transactionId: payment.transactionId,
        newCredit: updatedUser.credit
      })
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Payment processed successfully',
          data: {
            orderCode,
            amount,
            transactionId: payment.transactionId,
            newCredit: updatedUser.credit
          }
        },
        { status: 200 }
      )
    } else {
      // Payment failed or cancelled
      console.log(`[${timestamp}] ❌ Payment failed or cancelled:`, {
        code: data.code,
        desc: data.desc,
        orderCode: data.orderCode,
        amount: data.amount
      })
      
      // Tìm và cập nhật payment record nếu có
      if (data.orderCode) {
        try {
          const payment = await Payment.findOne({ orderCode: data.orderCode })
          if (payment && payment.status === 'pending') {
            payment.status = 'failed'
            payment.failureReason = data.desc || 'Payment failed'
            payment.failedAt = new Date()
            await payment.save()
            
            console.log(`[${timestamp}] Payment marked as failed:`, {
              orderCode: data.orderCode,
              reason: payment.failureReason
            })
          }
        } catch (updateError) {
          console.error(`[${timestamp}] Error updating failed payment:`, updateError)
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Payment failed or cancelled',
          data: {
            code: data.code,
            desc: data.desc,
            orderCode: data.orderCode
          }
        },
        { status: 200 }
      )
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error(`[${timestamp}] ❌ Webhook processing error:`, {
      error: errorMessage,
      stack: errorStack,
      webhookData: webhookData ? JSON.stringify(webhookData, null, 2) : 'No webhook data'
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        timestamp
      },
      { status: 500 }
    )
  }
}

// GET - Health check for webhook endpoint
export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] GET request to webhook endpoint`)
  console.log(`[${timestamp}] Request headers:`, Object.fromEntries(request.headers.entries()))
  console.log(`[${timestamp}] Request URL:`, request.url)
  
  // Xử lý validation request từ PayOS
  const url = new URL(request.url)
  const challenge = url.searchParams.get('challenge')
  const token = url.searchParams.get('token')
  
  if (challenge) {
    console.log(`[${timestamp}] PayOS validation challenge received:`, challenge)
    return new NextResponse(challenge, { status: 200 })
  }
  
  if (token) {
    console.log(`[${timestamp}] PayOS validation token received:`, token)
    return new NextResponse(token, { status: 200 })
  }
  
  return NextResponse.json(
    { 
      message: 'PayOS webhook endpoint is active',
      timestamp: timestamp,
      url: request.url,
      ready: true
    },
    { status: 200 }
  )
}
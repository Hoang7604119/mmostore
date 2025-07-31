import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import CassoTransaction from '@/models/CassoTransaction'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Hàm xác thực chữ ký từ Casso
function verifySignature(data: string, signature: string, secretKey: string): boolean {
  if (!secretKey || !signature) {
    console.log('Missing secret key or signature - skipping verification for testing')
    return true // Skip verification if not configured
  }
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(data)
      .digest('hex')
    
    return expectedSignature === signature
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

// Hàm xử lý giao dịch Casso
async function processTransaction(transaction: any) {
  try {
    // Kiểm tra xem giao dịch đã được xử lý chưa
    const existingTransaction = await CassoTransaction.findOne({ cassoId: transaction.id })
    if (existingTransaction) {
      console.log(`Transaction ${transaction.id} already processed`)
      return { 
        status: 'already_processed', 
        transactionId: transaction.id,
        username: existingTransaction.userId ? 'found' : 'not_found'
      }
    }

    // Tìm username từ description
    const description = transaction.description || ''
    const usernameMatch = description.match(/\b([a-zA-Z0-9_]{3,30})\b/)
    
    if (!usernameMatch) {
      // Lưu giao dịch nhưng không xử lý
      await CassoTransaction.create({
        cassoId: transaction.id,
        tid: transaction.tid,
        description: transaction.description,
        amount: transaction.amount,
        cusumBalance: transaction.cusum_balance,
        when: new Date(transaction.when),
        bankSubAccId: transaction.bank_sub_acc_id,
        subAccId: transaction.sub_acc_id,
        processed: false,
        error: 'Không tìm thấy username trong mô tả'
      })
      console.log(`No username found in transaction ${transaction.id}: ${description}`)
      return { 
        status: 'no_username', 
        transactionId: transaction.id,
        username: null
      }
    }

    const username = usernameMatch[1]
    console.log(`Found username: ${username} in transaction ${transaction.id}`)
    
    // Tìm user theo username
    const user = await User.findOne({ username: username })
    if (!user) {
      // Lưu giao dịch nhưng không xử lý
      await CassoTransaction.create({
        cassoId: transaction.id,
        tid: transaction.tid,
        description: transaction.description,
        amount: transaction.amount,
        cusumBalance: transaction.cusum_balance,
        when: new Date(transaction.when),
        bankSubAccId: transaction.bank_sub_acc_id,
        subAccId: transaction.sub_acc_id,
        processed: false,
        error: `Không tìm thấy user với username: ${username}`
      })
      console.log(`User not found for username: ${username}`)
      return { 
        status: 'user_not_found', 
        transactionId: transaction.id,
        username: username
      }
    }

    // Tạo payment record
    const orderCode = Date.now() // Generate unique order code
    const payment = await Payment.create({
      userId: user._id,
      orderCode: orderCode,
      amount: transaction.amount,
      status: 'paid',
      paymentMethod: 'bank',
      description: `Nạp tiền qua Casso - ${transaction.description}`,
      transactionId: transaction.tid
    })

    // Cập nhật credit cho user
    await User.findByIdAndUpdate(user._id, {
      $inc: { credit: transaction.amount }
    })

    // Lưu giao dịch Casso
    await CassoTransaction.create({
      cassoId: transaction.id,
      tid: transaction.tid,
      description: transaction.description,
      amount: transaction.amount,
      cusumBalance: transaction.cusum_balance,
      when: new Date(transaction.when),
      bankSubAccId: transaction.bank_sub_acc_id,
      subAccId: transaction.sub_acc_id,
      processed: true,
      userId: user._id,
      paymentId: payment._id
    })

    console.log(`Successfully processed transaction ${transaction.id} for user ${username}, amount: ${transaction.amount}`)
    
    return { 
      status: 'success', 
      transactionId: transaction.id,
      username: username,
      amount: transaction.amount,
      paymentId: payment._id
    }
  } catch (error) {
    console.error('Error processing transaction:', error)
    // Lưu giao dịch với lỗi
    try {
      await CassoTransaction.create({
        cassoId: transaction.id,
        tid: transaction.tid,
        description: transaction.description,
        amount: transaction.amount,
        cusumBalance: transaction.cusum_balance,
        when: new Date(transaction.when),
        bankSubAccId: transaction.bank_sub_acc_id,
        subAccId: transaction.sub_acc_id,
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } catch (saveError) {
      console.error('Error saving failed transaction:', saveError)
    }
    
    return { 
      status: 'error', 
      transactionId: transaction.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  
  try {
    // Log the request for debugging
    const body = await request.json()
    console.log(`[${timestamp}] Casso webhook received:`, JSON.stringify(body, null, 2))
    
    // Log headers
    const headers = Object.fromEntries(request.headers.entries())
    console.log(`[${timestamp}] Request headers:`, headers)
    
    // Xác thực chữ ký (có thể bỏ qua khi test)
    const signature = headers['x-secure-token']
    const secretKey = process.env.CASSO_SECURITY_KEY
    
    if (!verifySignature(JSON.stringify(body), signature, secretKey)) {
      console.error(`[${timestamp}] Invalid signature`)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    // Kết nối database
    await connectDB()
    console.log(`[${timestamp}] Connected to database`)
    
    // Xử lý từng giao dịch trong data
    const transactions = body.data || []
    console.log(`[${timestamp}] Processing ${transactions.length} transactions`)
    
    let successCount = 0
    let failureCount = 0
    const results = []
    
    for (const transaction of transactions) {
      console.log(`[${timestamp}] Processing transaction:`, transaction.id)
      const result = await processTransaction(transaction)
      results.push(result)
      
      if (result.status === 'success') {
        successCount++
      } else {
        failureCount++
      }
    }
    
    console.log(`[${timestamp}] Processing complete - Success: ${successCount}, Failures: ${failureCount}`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      timestamp: timestamp,
      processed: {
        total: transactions.length,
        success: successCount,
        failures: failureCount
      },
      results: results
    })
  } catch (error) {
    console.error(`[${timestamp}] Casso webhook error:`, error)
    return NextResponse.json({ 
      success: false, 
      message: 'Webhook processing failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: timestamp
    }, { status: 500 })
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  const timestamp = new Date().toISOString()
  const securityKey = process.env.CASSO_SECURITY_KEY
  
  return NextResponse.json({ 
    message: 'Casso webhook endpoint is active',
    timestamp: timestamp,
    environment: process.env.NODE_ENV,
    hasSecurityKey: !!securityKey,
    securityKeyLength: securityKey ? securityKey.length : 0
  })
}
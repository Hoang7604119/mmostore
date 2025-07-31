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

    // Tìm orderCode từ description
    const description = transaction.description || ''
    // Tìm tất cả các số trong description
    const numberMatches = description.match(/\d+/g)
    let orderCodeSuffix = null
    
    if (numberMatches) {
      console.log(`All numbers found in description: ${numberMatches.join(', ')}`)
      
      // Tìm kiếm orderCode theo thứ tự ưu tiên:
      // 1. Số có độ dài chính xác 8 chữ số (description từ PayOS)
      // 2. Số có độ dài 13 chữ số (timestamp format) và lấy 8 số cuối
      // 3. Số có độ dài 10-12 chữ số và lấy 8 số cuối
      // 4. Số có độ dài >= 8 chữ số và lấy 8 số cuối
      
      // Ưu tiên số có chính xác 8 chữ số (description từ PayOS)
      for (const match of numberMatches) {
        if (match.length === 8) {
          orderCodeSuffix = match
          console.log(`Found 8-digit number (PayOS description): ${match}, using as suffix: ${orderCodeSuffix}`)
          break
        }
      }
      
      // Nếu không tìm thấy số 8 chữ số, tìm số 13 chữ số (timestamp format)
      if (!orderCodeSuffix) {
        for (const match of numberMatches) {
          if (match.length === 13) {
            orderCodeSuffix = match.slice(-8) // Lấy 8 số cuối
            console.log(`Found 13-digit number (likely orderCode): ${match}, using suffix: ${orderCodeSuffix}`)
            break
          }
        }
      }
      
      // Nếu không tìm thấy số 13 chữ số, tìm số 10-12 chữ số
      if (!orderCodeSuffix) {
        for (const match of numberMatches) {
          if (match.length >= 10 && match.length <= 12) {
            orderCodeSuffix = match.slice(-8) // Lấy 8 số cuối
            console.log(`Found ${match.length}-digit number: ${match}, using suffix: ${orderCodeSuffix}`)
            break
          }
        }
      }
      
      // Nếu vẫn không tìm thấy, tìm số có ít nhất 8 chữ số
      if (!orderCodeSuffix) {
        for (const match of numberMatches) {
          if (match.length >= 8) {
            orderCodeSuffix = match.slice(-8) // Lấy 8 số cuối
            console.log(`Found ${match.length}-digit number: ${match}, using suffix: ${orderCodeSuffix}`)
            break
          }
        }
      }
      
      // Cuối cùng, nếu không tìm thấy số nào có ít nhất 8 chữ số, thử tìm số có 5 chữ số trở lên
      if (!orderCodeSuffix) {
        for (const match of numberMatches) {
          if (match.length >= 5) {
            orderCodeSuffix = match
            console.log(`Found ${match.length}-digit number: ${match}, using as suffix: ${orderCodeSuffix}`)
            break
          }
        }
      }
    }
    
    if (!orderCodeSuffix) {
      // Lưu giao dịch nhưng không xử lý
      await CassoTransaction.create({
        cassoId: transaction.id,
        tid: transaction.reference || transaction.tid,
        description: transaction.description,
        amount: transaction.amount,
        cusumBalance: transaction.runningBalance || transaction.cusum_balance || 0,
        when: new Date(transaction.transactionDateTime || transaction.when),
        bankSubAccId: transaction.bankSubAccId || transaction.bank_sub_acc_id,
        subAccId: transaction.subAccId || transaction.sub_acc_id,
        processed: false,
        error: 'Không tìm thấy mã đơn hàng trong mô tả'
      })
      console.log(`No order code found in transaction ${transaction.id}: ${description}`)
      return { 
        status: 'no_order_code', 
        transactionId: transaction.id,
        orderCode: null
      }
    }
    console.log(`Found order code suffix: ${orderCodeSuffix} in transaction ${transaction.id}`)
    
    // Tìm payment record theo 8 số cuối của orderCode
    // Chuyển orderCode thành string để so sánh
    const payments = await Payment.find({ status: 'pending' })
    const payment = payments.find(p => {
      const orderCodeStr = p.orderCode.toString()
      return orderCodeStr.endsWith(orderCodeSuffix)
    })
    
    if (!payment) {
      // Lưu giao dịch nhưng không xử lý
      await CassoTransaction.create({
        cassoId: transaction.id,
        tid: transaction.reference || transaction.tid,
        description: transaction.description,
        amount: transaction.amount,
        cusumBalance: transaction.runningBalance || transaction.cusum_balance || 0,
        when: new Date(transaction.transactionDateTime || transaction.when),
        bankSubAccId: transaction.bankSubAccId || transaction.bank_sub_acc_id,
        subAccId: transaction.subAccId || transaction.sub_acc_id,
        processed: false,
        error: `Không tìm thấy payment với orderCode kết thúc bằng: ${orderCodeSuffix}`
      })
      console.log(`Payment not found for order code suffix: ${orderCodeSuffix}`)
      return { 
        status: 'payment_not_found', 
        transactionId: transaction.id,
        orderCode: orderCodeSuffix
      }
    }

    // Kiểm tra số tiền có khớp không
    if (payment.amount !== transaction.amount) {
      await CassoTransaction.create({
        cassoId: transaction.id,
        tid: transaction.reference || transaction.tid,
        description: transaction.description,
        amount: transaction.amount,
        cusumBalance: transaction.runningBalance || transaction.cusum_balance || 0,
        when: new Date(transaction.transactionDateTime || transaction.when),
        bankSubAccId: transaction.bankSubAccId || transaction.bank_sub_acc_id,
        subAccId: transaction.subAccId || transaction.sub_acc_id,
        processed: false,
        error: `Số tiền không khớp: expected ${payment.amount}, received ${transaction.amount}`
      })
      console.log(`Amount mismatch for payment ${payment.orderCode}: expected ${payment.amount}, received ${transaction.amount}`)
      return { 
        status: 'amount_mismatch', 
        transactionId: transaction.id,
        orderCode: orderCodeSuffix,
        expectedAmount: payment.amount,
        receivedAmount: transaction.amount
      }
    }

    // Cập nhật payment status
    payment.status = 'paid'
    payment.transactionId = transaction.reference || transaction.tid
    payment.description = `${payment.description} - Casso: ${transaction.description}`
    await payment.save()

    // Cập nhật credit cho user
    await User.findByIdAndUpdate(payment.userId, {
      $inc: { credit: transaction.amount }
    })

    // Lưu giao dịch Casso
    await CassoTransaction.create({
      cassoId: transaction.id,
      tid: transaction.reference || transaction.tid,
      description: transaction.description,
      amount: transaction.amount,
      cusumBalance: transaction.runningBalance || transaction.cusum_balance || 0,
      when: new Date(transaction.transactionDateTime || transaction.when),
      bankSubAccId: transaction.bankSubAccId || transaction.bank_sub_acc_id,
      subAccId: transaction.subAccId || transaction.sub_acc_id,
      processed: true,
      userId: payment.userId,
      paymentId: payment._id
    })

    console.log(`Successfully processed transaction ${transaction.id} for orderCode ${payment.orderCode}, amount: ${transaction.amount}`)
    
    return { 
      status: 'success', 
      transactionId: transaction.id,
      orderCode: payment.orderCode,
      amount: transaction.amount,
      paymentId: payment._id
    }
  } catch (error) {
    console.error('Error processing transaction:', error)
    // Lưu giao dịch với lỗi
    try {
      await CassoTransaction.create({
        cassoId: transaction.id,
        tid: transaction.reference || transaction.tid,
        description: transaction.description,
        amount: transaction.amount,
        cusumBalance: transaction.runningBalance || transaction.cusum_balance || 0,
        when: new Date(transaction.transactionDateTime || transaction.when),
        bankSubAccId: transaction.bankSubAccId || transaction.bank_sub_acc_id,
        subAccId: transaction.subAccId || transaction.sub_acc_id,
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

    if (!secretKey || !verifySignature(JSON.stringify(body), signature, secretKey)) {
      console.error(`[${timestamp}] Invalid signature`)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }
    
    // Kết nối database
    await connectDB()
    console.log(`[${timestamp}] Connected to database`)
    
    // Xử lý cấu trúc dữ liệu linh hoạt
    let transactions = []
    
    // Trường hợp 1: Cấu trúc {"error": 0, "data": {...}}
    if (body.error === 0 && body.data) {
      if (Array.isArray(body.data)) {
        transactions = body.data
      } else {
        transactions = [body.data]
      }
    }
    // Trường hợp 2: body.data là mảng
    else if (body.data && Array.isArray(body.data)) {
      transactions = body.data
    }
    // Trường hợp 3: body.data là một đối tượng
    else if (body.data && typeof body.data === 'object') {
      transactions = [body.data]
    }
    // Trường hợp 4: toàn bộ body là một giao dịch
    else if (body.id && body.description) {
      transactions = [body]
    }
    // Trường hợp 5: body là mảng các giao dịch
    else if (Array.isArray(body)) {
      transactions = body
    }

    console.log(`Processing ${transactions.length} transactions`)
     console.log('Transactions data:', JSON.stringify(transactions, null, 2))
    
    let successCount = 0
    let failureCount = 0
    const results = []
    
    if (transactions && transactions.length > 0) {
      for (const transaction of transactions) {
        try {
          console.log(`[${timestamp}] Processing transaction:`, transaction.id)
          const result = await processTransaction(transaction)
          results.push(result)
          
          if (result.status === 'success') {
            successCount++
          } else {
            failureCount++
          }
        } catch (error) {
          console.error('Error processing transaction:', error)
          failureCount++
          results.push({
            status: 'error',
            transactionId: transaction.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    } else {
      console.log('No transactions to process')
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
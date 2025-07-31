import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/utils'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import CassoTransaction from '@/models/CassoTransaction'

export const dynamic = 'force-dynamic'

// Hàm gọi Casso API để lấy giao dịch mới
async function fetchCassoTransactions() {
  const cassoAPI = process.env.CASSO_API_KEY
  if (!cassoAPI) {
    throw new Error('CASSO_API_KEY not configured')
  }

  const response = await fetch('https://oauth.casso.vn/v2/transactions', {
    method: 'GET',
    headers: {
      'Authorization': `Apikey ${cassoAPI}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Casso API error: ${response.status}`)
  }

  const data = await response.json()
  return data.data?.records || []
}

// Hàm xử lý giao dịch Casso
async function processCassoTransaction(transaction: any) {
  try {
    // Kiểm tra xem giao dịch đã được xử lý chưa
    const existingTransaction = await CassoTransaction.findOne({ cassoId: transaction.id })
    if (existingTransaction) {
      return { processed: true, existing: true }
    }

    // Tìm username từ description
    const description = transaction.description || ''
    const usernameMatch = description.match(/\b([a-zA-Z0-9_]{3,30})\b/)
    
    if (!usernameMatch) {
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
        error: 'Không tìm thấy username trong mô tả'
      })
      return { processed: false, error: 'Không tìm thấy username' }
    }

    const username = usernameMatch[1]
    
    // Tìm user theo username
    const user = await User.findOne({ username: username })
    if (!user) {
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
        error: `Không tìm thấy user với username: ${username}`
      })
      return { processed: false, error: 'Không tìm thấy user' }
    }

    let payment = null
    
    // Chỉ tạo payment record và cộng credit khi amount dương
    if (transaction.amount > 0) {
      const orderCode = Date.now() // Generate unique order code
      payment = await Payment.create({
        userId: user._id,
        orderCode: orderCode,
        amount: transaction.amount,
        status: 'paid',
        paymentMethod: 'bank',
        description: `Nạp tiền qua Casso - ${transaction.description}`,
        transactionId: transaction.reference || transaction.tid
      })

      // Cập nhật credit cho user
      await User.findByIdAndUpdate(user._id, {
        $inc: { credit: transaction.amount }
      })
    }

    // Lưu giao dịch Casso
    const cassoTransactionData: any = {
      cassoId: transaction.id,
      tid: transaction.reference || transaction.tid,
      description: transaction.description,
      amount: transaction.amount,
      cusumBalance: transaction.runningBalance || transaction.cusum_balance || 0,
      when: new Date(transaction.transactionDateTime || transaction.when),
      bankSubAccId: transaction.bankSubAccId || transaction.bank_sub_acc_id,
      subAccId: transaction.subAccId || transaction.sub_acc_id,
      processed: true,
      userId: user._id
    }
    
    // Chỉ thêm paymentId nếu có payment (amount dương)
    if (payment) {
      cassoTransactionData.paymentId = payment._id
    }
    
    await CassoTransaction.create(cassoTransactionData)

    return { 
      processed: true, 
      userId: user._id, 
      username: username, 
      amount: transaction.amount,
      paymentId: payment?._id || null,
      note: transaction.amount <= 0 ? 'Giao dịch âm - không cộng credit' : 'Đã cộng credit'
    }
  } catch (error) {
    console.error('Error processing Casso transaction:', error)
    return { processed: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    await connectDB()

    const body = await request.json()
    const { orderCode } = body

    // Lấy giao dịch từ Casso
    const transactions = await fetchCassoTransactions()
    
    let syncResults = []
    let userPaymentFound = false

    // Xử lý từng giao dịch
    for (const transaction of transactions) {
      const result = await processCassoTransaction(transaction)
      syncResults.push({
        transactionId: transaction.id,
        ...result
      })

      // Kiểm tra xem có giao dịch nào của user hiện tại không
      if (result.processed && result.userId?.toString() === decoded.userId) {
        userPaymentFound = true
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Đồng bộ Casso thành công',
      syncResults: syncResults,
      userPaymentFound: userPaymentFound,
      totalProcessed: syncResults.filter(r => r.processed).length
    })

  } catch (error) {
    console.error('Sync Casso error:', error)
    return NextResponse.json(
        {
          success: false,
          error: 'Lỗi đồng bộ Casso',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
  }
}
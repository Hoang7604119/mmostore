import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import CassoTransaction from '@/models/CassoTransaction'

// Casso webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Casso webhook received:', JSON.stringify(body, null, 2))

    // Verify webhook signature
    const signature = request.headers.get('x-secure-token')
    const securityKey = process.env.CASSO_SECURITY_KEY
    
    if (!securityKey) {
      console.error('CASSO_SECURITY_KEY not configured')
      return NextResponse.json({ error: 'Security key not configured' }, { status: 500 })
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', securityKey)
      .update(JSON.stringify(body))
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Process the webhook data
    const { data } = body
    
    if (!data || !Array.isArray(data)) {
      console.error('Invalid webhook data format')
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    // Process each transaction
    for (const transaction of data) {
      await processTransaction(transaction)
    }

    return NextResponse.json({ success: true, message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('Casso webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function processTransaction(transaction: any) {
  try {
    const {
      id,
      tid,
      description,
      amount,
      cusum_balance,
      when,
      bank_sub_acc_id,
      subAccId
    } = transaction

    // Check if transaction already processed
    const existingTransaction = await CassoTransaction.findOne({
      cassoId: id.toString()
    })

    if (existingTransaction) {
      console.log(`Transaction ${id} already processed`)
      return
    }

    // Parse description to find username
    // Expected format: "NAP [USERNAME]" or "NAP USERNAME"
    const descriptionUpper = description.toUpperCase()
    let username = null
    
    const napMatch = descriptionUpper.match(/NAP\s*\[?([A-Z0-9_]+)\]?/)
    if (napMatch) {
      username = napMatch[1].toLowerCase()
    }

    if (!username) {
      console.log(`No valid username found in description: ${description}`)
      // Save transaction but don't credit any user
      await CassoTransaction.create({
        cassoId: id.toString(),
        tid: tid?.toString(),
        description,
        amount,
        cusumBalance: cusum_balance,
        when: new Date(when),
        bankSubAccId: bank_sub_acc_id?.toString(),
        subAccId: subAccId?.toString(),
        processed: false,
        error: 'No valid username found in description'
      })
      return
    }

    // Find user by username
    const user = await User.findOne({ username })

    if (!user) {
      console.log(`User not found: ${username}`)
      // Save transaction but don't credit any user
      await CassoTransaction.create({
        cassoId: id.toString(),
        tid: tid?.toString(),
        description,
        amount,
        cusumBalance: cusum_balance,
        when: new Date(when),
        bankSubAccId: bank_sub_acc_id?.toString(),
        subAccId: subAccId?.toString(),
        processed: false,
        error: `User not found: ${username}`
      })
      return
    }

    // Create payment record
    const payment = await Payment.create({
      userId: user._id,
      amount,
      paymentMethod: 'casso',
      status: 'paid',
      orderCode: `CASSO_${id}`,
      description: `Nạp tiền qua Casso - ${description}`,
      metadata: {
        cassoTransactionId: id,
        tid,
        bankSubAccId: bank_sub_acc_id,
        subAccId
      }
    })

    // Update user credit
    await User.findByIdAndUpdate(user._id, {
      $inc: { credit: amount }
    })

    // Save Casso transaction record
    await CassoTransaction.create({
      cassoId: id.toString(),
      tid: tid?.toString(),
      description,
      amount,
      cusumBalance: cusum_balance,
      when: new Date(when),
      bankSubAccId: bank_sub_acc_id?.toString(),
      subAccId: subAccId?.toString(),
      processed: true,
      userId: user._id,
      paymentId: payment._id
    })

    console.log(`Successfully processed transaction ${id} for user ${username}, amount: ${amount}`)
  } catch (error) {
    console.error('Error processing transaction:', error)
    // Try to save the transaction with error status
    try {
      await CassoTransaction.create({
        cassoId: transaction.id.toString(),
        tid: transaction.tid?.toString(),
        description: transaction.description,
        amount: transaction.amount,
        cusumBalance: transaction.cusum_balance,
        when: new Date(transaction.when),
        bankSubAccId: transaction.bank_sub_acc_id?.toString(),
        subAccId: transaction.subAccId?.toString(),
        processed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } catch (saveError) {
      console.error('Error saving failed transaction:', saveError)
    }
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ 
    message: 'Casso webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}
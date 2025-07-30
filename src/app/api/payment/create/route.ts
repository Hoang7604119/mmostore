import { NextRequest, NextResponse } from 'next/server'
import { payOS } from '@/config/payos'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Payment from '@/models/Payment'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST - Tạo link thanh toán PayOS
export async function POST(request: NextRequest) {
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

    // Get user info
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Người dùng không tồn tại' },
        { status: 404 }
      )
    }

    const { amount } = await request.json()
    
    // Validate amount
    if (!amount || amount < 10000) {
      return NextResponse.json(
        { error: 'Số tiền nạp tối thiểu là 10,000 VNĐ' },
        { status: 400 }
      )
    }

    if (amount > 50000000) {
      return NextResponse.json(
        { error: 'Số tiền nạp tối đa là 50,000,000 VNĐ' },
        { status: 400 }
      )
    }

    // Generate unique order code
    const orderCode = Date.now()
    
    // Create payment data - description using last 8 digits of orderCode
    const description = orderCode.toString().slice(-8)
    
    const paymentData = {
      orderCode: orderCode,
      amount: amount,
      description: description,
      returnUrl: `${process.env.NODE_ENV === 'production' ? 'https://mmostore.site' : 'http://localhost:3000'}/dashboard/credit?status=success&orderCode=${orderCode}`,
      cancelUrl: `${process.env.NODE_ENV === 'production' ? 'https://mmostore.site' : 'http://localhost:3000'}/dashboard/credit?status=cancel&orderCode=${orderCode}`,
      buyerName: user.username.substring(0, 20),
      buyerEmail: user.email,
      items: [{
        name: 'Nap',
        quantity: 1,
        price: amount
      }]
    }

    // Create payment link
    const paymentLink = await payOS.createPaymentLink(paymentData)
    console.log('PayOS response:', paymentLink)
    
    // Store payment info in database
    const payment = new Payment({
      userId: user._id,
      orderCode: orderCode,
      amount: amount,
      status: 'pending',
      paymentMethod: 'payos',
      description: paymentData.description,
      paymentUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode
    })
    
    await payment.save()
    
    return NextResponse.json({
      success: true,
      data: {
        orderCode: orderCode,
        amount: amount,
        paymentUrl: paymentLink.checkoutUrl,
        qrCode: paymentLink.qrCode
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Create payment error:', error)
    return NextResponse.json(
      { error: 'Lỗi tạo link thanh toán' },
      { status: 500 }
    )
  }
}
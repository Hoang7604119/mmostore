import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import User from '@/models/User'
import { verifyToken } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    await connectDB()
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Không có token' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = verifyToken(token)
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Token không hợp lệ' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy user' },
        { status: 404 }
      )
    }

    const { orderId } = params

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Find the order and populate related data
    const order = await Order.findById(orderId)
      .populate({
        path: 'buyerId',
        select: 'username email'
      })
      .populate({
        path: 'productId',
        select: 'title type category pricePerUnit description sellerId'
      })
      .populate('accountItems')
      .lean()

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if the current user is the seller of this order
    if ((order.productId as any).sellerId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: order
    })

  } catch (error) {
    console.error('Error fetching order details:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
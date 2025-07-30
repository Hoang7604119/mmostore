import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import { verifyToken } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    await connectDB()
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token không hợp lệ' },
        { status: 401 }
      )
    }
    
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Token không hợp lệ' },
        { status: 401 }
      )
    }
    
    const { orderNumber } = params
    
    // Find order by order number
    const order = await Order.findOne({ orderNumber })
      .populate('buyerId', 'username email')
      .populate('sellerId', 'username email')
      .populate('productId', 'name title type pricePerUnit description')
      .populate('accountItems', 'username password email additionalInfo accountData fieldNames')
      .lean()
    
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      )
    }
    
    // Check if user has permission to view this order
    const canView = 
      (order as any).buyerId?._id?.toString() === decoded.userId ||
      (order as any).sellerId?._id?.toString() === decoded.userId ||
      decoded.role === 'admin' ||
      decoded.role === 'manager'
    
    if (!canView) {
      return NextResponse.json(
        { success: false, message: 'Không có quyền xem đơn hàng này' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: { order }
    })
    
  } catch (error) {
    console.error('Get order detail error:', error)
    return NextResponse.json(
      { success: false, message: 'Lỗi server' },
      { status: 500 }
    )
  }
}
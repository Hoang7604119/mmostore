import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/Product'
import User from '@/models/User'
import AccountItem from '@/models/AccountItem'
import { verifyToken } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// Type for populated order
type PopulatedOrder = any

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Get token from cookies (consistent with auth/me endpoint)
    const token = request.cookies.get('token')?.value
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
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const orderNumber = searchParams.get('orderNumber')
    
    // Build filter
    const filter: any = { buyerId: decoded.userId }
    if (status && status !== 'all') {
      filter.status = status
    }
    if (orderNumber) {
      filter.orderNumber = { $regex: orderNumber, $options: 'i' }
    }
    
    // Get orders with pagination (without populate to avoid schema issues)
    const skip = (page - 1) * limit
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    // Manually populate the required fields
    for (let order of orders) {
      const populatedOrder = order as PopulatedOrder
      
      // Get seller info
      if (populatedOrder.sellerId) {
        const seller = await User.findById(populatedOrder.sellerId).select('username email').lean()
        populatedOrder.sellerId = seller
      }
      
      // Get product info
      if (populatedOrder.productId) {
        const product = await Product.findById(populatedOrder.productId).select('name title type pricePerUnit').lean()
        populatedOrder.productId = product
      }
      
      // Get account items
      if (populatedOrder.accountItems && populatedOrder.accountItems.length > 0) {
        const accountItems = await AccountItem.find({ _id: { $in: populatedOrder.accountItems } })
          .select('username password email additionalInfo accountData fieldNames')
          .lean()
        populatedOrder.accountItems = accountItems
      }
    }
    
    const totalOrders = await Order.countDocuments(filter)
    const totalPages = Math.ceil(totalOrders / limit)
    
    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    })
    
  } catch (error) {
    console.error('Get orders error:', error)
    return NextResponse.json(
      { success: false, message: 'Lỗi server' },
      { status: 500 }
    )
  }
}
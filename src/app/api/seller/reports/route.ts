import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Report from '@/models/Report'
import Product from '@/models/Product'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Verify authentication
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'seller') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get seller's products
    const sellerProducts = await Product.find({ sellerId: decoded.userId }).select('_id')
    const productIds = sellerProducts.map(product => product._id)

    // Get reports for seller's products
    const reports = await Report.find({ 
      productId: { $in: productIds } 
    })
    .populate({
      path: 'productId',
      select: 'title type category price description'
    })
    .populate({
      path: 'buyerId',
      select: 'username email'
    })
    .populate({
      path: 'accountItemId',
      select: 'username email password additionalInfo'
    })
    .sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      reports
    })

  } catch (error) {
    console.error('Error fetching seller reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
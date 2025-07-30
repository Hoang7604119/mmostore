import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ProductType from '@/models/ProductType'

export const dynamic = 'force-dynamic'

// GET - Lấy danh sách product types cho public (marketplace)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Lấy chỉ những product types đang active, sắp xếp theo order và displayName
    const productTypes = await ProductType.find({ isActive: true })
      .sort({ order: 1, displayName: 1 })
      .select('name displayName color image description order')
    
    return NextResponse.json({ productTypes }, { status: 200 })

  } catch (error) {
    console.error('Get product types error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
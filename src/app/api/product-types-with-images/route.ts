import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ProductType from '@/models/ProductType'
import { getImageUrl } from '@/lib/imageUtils'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'

// GET - Lấy danh sách product types với base64 images
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Lấy chỉ những product types đang active
    const productTypes = await ProductType.find({ isActive: true })
      .sort({ order: 1, displayName: 1 })
      .select('name displayName color image blobUrl description order')
    
    // Process images with unified logic
    const productTypesWithImages = await Promise.all(
      productTypes.map(async (type) => {
        const typeObj = type.toObject()
        
        // Use unified image URL logic from imageUtils
        typeObj.finalImageUrl = getImageUrl(typeObj)
        
        return typeObj
      })
    )

    return NextResponse.json({ productTypes: productTypesWithImages }, { status: 200 })

  } catch (error) {
    console.error('Get product types with images error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
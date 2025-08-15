import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import AccountItem from '@/models/AccountItem'
import { getImageUrl } from '@/lib/imageUtils'

export const dynamic = 'force-dynamic'

// GET - Lấy tất cả sản phẩm đã được duyệt cho buyer
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const skip = (page - 1) * limit
    


    // Build query for approved products only
    const query: any = { status: 'approved' }
    
    if (type && type !== 'all') {
      query.type = type
    }
    
    if (category && category !== 'all') {
      query.category = category
    }
    
    if (minPrice || maxPrice) {
      query.pricePerUnit = {}
      if (minPrice) query.pricePerUnit.$gte = parseInt(minPrice)
      if (maxPrice) query.pricePerUnit.$lte = parseInt(maxPrice)
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ]
    }


    
    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query)
    const totalPages = Math.ceil(totalProducts / limit)
    


    // Get products with seller info and pagination
    const products = await Product.find(query)
      .populate({
        path: 'sellerId',
        select: '_id username email rating',
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      


    // Get available account counts
    const productsWithAvailability = await Promise.all(
      products.map(async (product) => {
        const availableCount = await AccountItem.countDocuments({
          productId: product._id,
          status: 'available'
        })
        
        // Only update to sold_out if there were accounts before but now all are sold
        const totalAccountItems = await AccountItem.countDocuments({
          productId: product._id
        })
        
        // If there are account items but none available, mark as sold out
        if (totalAccountItems > 0 && availableCount === 0 && product.status !== 'sold_out') {
          await Product.findByIdAndUpdate(product._id, { status: 'sold_out' })
          product.status = 'sold_out'
        }
        
        // Process images with proper URL handling
        const processedImages = (product.images || []).map((imagePath: string) => {
          // If it's already a full URL, return as-is
          if (imagePath.startsWith('http')) {
            return imagePath
          }
          // Convert legacy path to proper URL using imageUtils
          return getImageUrl({ image: imagePath })
        })

        return {
          _id: product._id,
          title: product.title,
          description: product.description,
          price: product.pricePerUnit, // For backward compatibility
          pricePerUnit: product.pricePerUnit,
          category: product.category,
          type: product.type,
          quantity: product.quantity,
          availableCount,
          totalAccountItems,
          soldCount: product.soldCount,
          rating: product.rating,
          reviewCount: product.reviewCount,
          status: product.status,
          seller: {
            _id: product.sellerId?._id || product.sellerId,
            username: product.sellerId?.username || 'Unknown',
            email: product.sellerId?.email || '',
            rating: product.sellerId?.rating || 5.0
          },
          createdAt: product.createdAt,
          images: processedImages
        }
      })
    )

    // Show all approved products, including those without account items yet
    const availableProducts = productsWithAvailability

    const response = {
      products: availableProducts,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
    

    
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ [DEBUG API] Get buyer products error:', error)
    console.error('❌ [DEBUG API] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
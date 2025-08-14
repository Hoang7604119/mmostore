import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product, { IProduct } from '@/models/Product'
import User from '@/models/User'
import AccountItem from '@/models/AccountItem'
import { getImageUrl } from '@/lib/imageUtils'

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    await connectDB()
    
    const { productId } = params
    
    if (!productId) {
      return NextResponse.json(
        { message: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Find product with seller information
    const product = await Product.findById(productId)
      .populate('sellerId', 'username email rating')
      .lean() as IProduct & { sellerId: { username: string; email: string; rating: number } } | null

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      )
    }

    // Only return approved products for public access
    if (product.status !== 'approved') {
      return NextResponse.json(
        { message: 'Product not available' },
        { status: 404 }
      )
    }

    // Get account items count
    const totalAccountItems = await AccountItem.countDocuments({
      productId: product._id
    })
    
    const availableAccountItems = await AccountItem.countDocuments({
      productId: product._id,
      status: 'available'
    })

    // Process images with proper URL handling
    const processedImages = (product.images || []).map(imagePath => {
      // If it's already a full URL, return as-is
      if (imagePath.startsWith('http')) {
        return imagePath
      }
      // Convert legacy path to proper URL using imageUtils
      return getImageUrl({ image: imagePath })
    })

    // Transform the product data to match the expected format
    const transformedProduct = {
      _id: product._id,
      type: product.type,
      title: product.title,
      description: product.description,
      pricePerUnit: product.pricePerUnit,
      quantity: product.quantity,
      soldCount: product.soldCount,
      category: product.category,
      images: processedImages,
      status: product.status,
      createdAt: product.createdAt,
      rating: product.rating || 0,
      reviewCount: product.reviewCount || 0,
      seller: {
        _id: product.sellerId._id,
        username: product.sellerId.username,
        email: product.sellerId.email,
        rating: product.sellerId.rating
      },
      availableCount: availableAccountItems,
      totalAccountItems: totalAccountItems
    }

    return NextResponse.json({
      success: true,
      product: transformedProduct
    })

  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
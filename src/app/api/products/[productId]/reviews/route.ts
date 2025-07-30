import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/Review'
import { verifyToken } from '@/lib/auth'

// GET /api/products/[productId]/reviews - Get reviews for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'newest' // newest, oldest, highest, lowest
    
    const skip = (page - 1) * limit
    
    // Build sort criteria
    let sortCriteria: any = { createdAt: -1 } // Default: newest first
    switch (sortBy) {
      case 'oldest':
        sortCriteria = { createdAt: 1 }
        break
      case 'highest':
        sortCriteria = { rating: -1, createdAt: -1 }
        break
      case 'lowest':
        sortCriteria = { rating: 1, createdAt: -1 }
        break
    }
    
    // Get reviews with pagination
    const reviews = await Review.find({ 
      productId: params.productId,
      isHidden: false 
    })
    .populate('userId', 'username')
    .sort(sortCriteria)
    .skip(skip)
    .limit(limit)
    .lean()
    
    // Get total count for pagination
    const totalReviews = await Review.countDocuments({ 
      productId: params.productId,
      isHidden: false 
    })
    
    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { 
        $match: { 
          productId: params.productId,
          isHidden: false 
        } 
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ])
    
    // Format rating distribution
    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const found = ratingDistribution.find(item => item._id === rating)
      return {
        rating,
        count: found ? found.count : 0,
        percentage: totalReviews > 0 ? Math.round((found ? found.count : 0) / totalReviews * 100) : 0
      }
    })
    
    // Calculate average rating
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0
    
    return NextResponse.json({
      reviews: reviews.map(review => ({
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        images: review.images || [],
        isVerifiedPurchase: review.isVerifiedPurchase,
        sellerReply: review.sellerReply,
        helpfulCount: review.helpfulCount,
        createdAt: review.createdAt,
        user: {
          _id: review.userId._id,
          username: review.userId.username
        }
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNext: page < Math.ceil(totalReviews / limit),
        hasPrev: page > 1
      },
      summary: {
        averageRating: Math.round(avgRating * 10) / 10,
        totalReviews,
        distribution
      }
    }, { status: 200 })
    
  } catch (error) {
    console.error('Get product reviews error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// POST /api/products/[productId]/reviews - Create a new review
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    await connectDB()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập' },
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
    
    const { rating, comment, images } = await request.json()
    
    // Validate required fields
    if (!rating || !comment) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin đánh giá' },
        { status: 400 }
      )
    }
    
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Đánh giá phải từ 1 đến 5 sao' },
        { status: 400 }
      )
    }
    
    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      productId: params.productId,
      userId: decoded.userId
    })
    
    if (existingReview) {
      return NextResponse.json(
        { error: 'Bạn đã đánh giá sản phẩm này rồi' },
        { status: 400 }
      )
    }
    
    // Get product to find seller
    const Product = (await import('@/models/Product')).default
    const product = await Product.findById(params.productId)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      )
    }
    
    // Create review
    const review = new Review({
      productId: params.productId,
      userId: decoded.userId, // Changed from buyerId to userId to allow all roles
      sellerId: product.sellerId,
      rating,
      comment: comment.trim(),
      images: images || [],
      isVerifiedPurchase: false // Set to false since no order verification
    })
    
    await review.save()
    
    // Send notification to seller
    const { notifyNewReview } = await import('@/utils/notificationHelpers')
    const User = (await import('@/models/User')).default
    
    const user = await User.findById(decoded.userId)
    
    if (product && user) {
      await notifyNewReview(
        product.sellerId.toString(),
        product.title,
        rating,
        user.username,
        params.productId
      )
    }
    
    return NextResponse.json({
      message: 'Đánh giá đã được gửi thành công',
      reviewId: review._id
    }, { status: 201 })
    
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
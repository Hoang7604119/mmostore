import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/Review'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/buyer/reviews - Get reviews written by buyer
export async function GET(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const rating = searchParams.get('rating') // '1', '2', '3', '4', '5'
    const hasReply = searchParams.get('hasReply') // 'true', 'false'
    
    const skip = (page - 1) * limit
    
    // Build filter criteria
    const filter: any = {
      userId: decoded.userId, // Changed from buyerId to userId to allow all roles
      isHidden: false
    }
    
    if (rating) {
      filter.rating = parseInt(rating)
    }
    
    if (hasReply === 'true') {
      filter['sellerReply.comment'] = { $exists: true }
    } else if (hasReply === 'false') {
      filter['sellerReply.comment'] = { $exists: false }
    }
    
    // Get reviews with pagination
    const reviews = await Review.find(filter)
      .populate('sellerId', 'username')
      .populate('productId', 'title images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    // Get total count for pagination
    const totalReviews = await Review.countDocuments(filter)
    
    // Get summary statistics
    const stats = await Review.aggregate([
      { $match: { buyerId: decoded.userId, isHidden: false } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          repliesReceived: {
            $sum: {
              $cond: [{ $ifNull: ['$sellerReply.comment', false] }, 1, 0]
            }
          },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ])
    
    // Calculate rating distribution
    let distribution = [5, 4, 3, 2, 1].map(rating => ({ rating, count: 0 }))
    if (stats.length > 0 && stats[0].ratingDistribution) {
      stats[0].ratingDistribution.forEach((rating: number) => {
        const index = distribution.findIndex(item => item.rating === rating)
        if (index !== -1) {
          distribution[index].count++
        }
      })
    }
    
    const summary = stats.length > 0 ? {
      totalReviews: stats[0].totalReviews,
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      repliesReceived: stats[0].repliesReceived,
      replyRate: stats[0].totalReviews > 0 ? Math.round((stats[0].repliesReceived / stats[0].totalReviews) * 100) : 0,
      distribution
    } : {
      totalReviews: 0,
      averageRating: 0,
      repliesReceived: 0,
      replyRate: 0,
      distribution
    }
    
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
        seller: {
          _id: review.sellerId._id,
          username: review.sellerId.username
        },
        product: {
          _id: review.productId._id,
          title: review.productId.title,
          images: review.productId.images
        }
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNext: page < Math.ceil(totalReviews / limit),
        hasPrev: page > 1
      },
      summary
    }, { status: 200 })
    
  } catch (error) {
    console.error('Get buyer reviews error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
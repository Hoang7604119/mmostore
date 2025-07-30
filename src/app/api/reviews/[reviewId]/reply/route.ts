import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/Review'
import { verifyToken } from '@/lib/auth'

// POST /api/reviews/[reviewId]/reply - Seller reply to a review
export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
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
    
    const { comment } = await request.json()
    
    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng nhập nội dung phản hồi' },
        { status: 400 }
      )
    }
    
    if (comment.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Phản hồi không được vượt quá 1000 ký tự' },
        { status: 400 }
      )
    }
    
    // Find the review
    const review = await Review.findById(params.reviewId)
    
    if (!review) {
      return NextResponse.json(
        { error: 'Không tìm thấy đánh giá' },
        { status: 404 }
      )
    }
    
    // Check if user is the seller of the product
    if (review.sellerId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Bạn không có quyền phản hồi đánh giá này' },
        { status: 403 }
      )
    }
    
    // Check if seller already replied
    if (review.sellerReply) {
      return NextResponse.json(
        { error: 'Bạn đã phản hồi đánh giá này rồi' },
        { status: 400 }
      )
    }
    
    // Update review with seller reply
    review.sellerReply = {
      comment: comment.trim(),
      repliedAt: new Date()
    }
    
    await review.save()
    
    // Send notification to buyer
    const { sendNotification } = await import('@/lib/notifications')
    const Product = (await import('@/models/Product')).default
    const User = (await import('@/models/User')).default
    
    const product = await Product.findById(review.productId)
    const seller = await User.findById(decoded.userId)
    
    if (product && seller) {
      await sendNotification(
        'SELLER_REPLY',
        review.userId.toString(), // Changed from buyerId to userId
        {
          productName: product.title,
          sellerName: seller.username,
          replyDate: new Date().toLocaleDateString('vi-VN')
        },
        `/dashboard/buyer/orders?tab=reviews`
      )
    }
    
    return NextResponse.json({
      message: 'Phản hồi đã được gửi thành công'
    }, { status: 200 })
    
  } catch (error) {
    console.error('Reply to review error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// PUT /api/reviews/[reviewId]/reply - Update seller reply
export async function PUT(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
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
    
    const { comment } = await request.json()
    
    if (!comment || comment.trim().length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng nhập nội dung phản hồi' },
        { status: 400 }
      )
    }
    
    if (comment.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Phản hồi không được vượt quá 1000 ký tự' },
        { status: 400 }
      )
    }
    
    // Find the review
    const review = await Review.findById(params.reviewId)
    
    if (!review) {
      return NextResponse.json(
        { error: 'Không tìm thấy đánh giá' },
        { status: 404 }
      )
    }
    
    // Check if user is the seller of the product
    if (review.sellerId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Bạn không có quyền chỉnh sửa phản hồi này' },
        { status: 403 }
      )
    }
    
    // Check if seller has replied
    if (!review.sellerReply) {
      return NextResponse.json(
        { error: 'Chưa có phản hồi để chỉnh sửa' },
        { status: 400 }
      )
    }
    
    // Update seller reply
    review.sellerReply.comment = comment.trim()
    
    await review.save()
    
    return NextResponse.json({
      message: 'Phản hồi đã được cập nhật thành công'
    }, { status: 200 })
    
  } catch (error) {
    console.error('Update reply error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// DELETE /api/reviews/[reviewId]/reply - Delete seller reply
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
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
    
    // Find the review
    const review = await Review.findById(params.reviewId)
    
    if (!review) {
      return NextResponse.json(
        { error: 'Không tìm thấy đánh giá' },
        { status: 404 }
      )
    }
    
    // Check if user is the seller of the product
    if (review.sellerId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa phản hồi này' },
        { status: 403 }
      )
    }
    
    // Check if seller has replied
    if (!review.sellerReply) {
      return NextResponse.json(
        { error: 'Không có phản hồi để xóa' },
        { status: 400 }
      )
    }
    
    // Remove seller reply
    review.sellerReply = undefined
    
    await review.save()
    
    return NextResponse.json({
      message: 'Phản hồi đã được xóa thành công'
    }, { status: 200 })
    
  } catch (error) {
    console.error('Delete reply error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
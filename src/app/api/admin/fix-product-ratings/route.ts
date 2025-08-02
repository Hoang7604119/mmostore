import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Review from '@/models/Review'
import Product from '@/models/Product'
import { verifyToken } from '@/lib/auth'

// POST /api/admin/fix-product-ratings - Fix product ratings and review counts
export async function POST(request: NextRequest) {
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

    // Check if user is admin/manager
    const User = (await import('@/models/User')).default
    const user = await User.findById(decoded.userId)
    
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Bạn không có quyền thực hiện thao tác này' },
        { status: 403 }
      )
    }

    // Get all products
    const products = await Product.find({})
    let updatedCount = 0
    
    for (const product of products) {
      // Calculate new rating and review count for this product
      const reviews = await Review.find({ 
        productId: product._id, 
        isHidden: false 
      })
      
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0
      const reviewCount = reviews.length
      
      // Update product if values are different
      const newRating = Math.round(averageRating * 10) / 10
      if (product.rating !== newRating || product.reviewCount !== reviewCount) {
        await Product.findByIdAndUpdate(product._id, {
          rating: newRating,
          reviewCount: reviewCount
        })
        updatedCount++
      }
    }

    return NextResponse.json({
      message: `Đã cập nhật ${updatedCount} sản phẩm`,
      totalProducts: products.length,
      updatedProducts: updatedCount
    }, { status: 200 })
    
  } catch (error) {
    console.error('Fix product ratings error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// GET /api/admin/fix-product-ratings - Check product ratings status
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

    // Check if user is admin/manager
    const User = (await import('@/models/User')).default
    const user = await User.findById(decoded.userId)
    
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Bạn không có quyền thực hiện thao tác này' },
        { status: 403 }
      )
    }

    // Get products with incorrect ratings
    const products = await Product.find({})
    const issues = []
    
    for (const product of products) {
      const reviews = await Review.find({ 
        productId: product._id, 
        isHidden: false 
      })
      
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0
      const reviewCount = reviews.length
      const expectedRating = Math.round(averageRating * 10) / 10
      
      if (product.rating !== expectedRating || product.reviewCount !== reviewCount) {
        issues.push({
          productId: product._id,
          title: product.title,
          currentRating: product.rating,
          expectedRating: expectedRating,
          currentReviewCount: product.reviewCount,
          expectedReviewCount: reviewCount,
          actualReviews: reviews.length
        })
      }
    }

    return NextResponse.json({
      totalProducts: products.length,
      issuesFound: issues.length,
      issues: issues.slice(0, 10) // Show first 10 issues
    }, { status: 200 })
    
  } catch (error) {
    console.error('Check product ratings error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
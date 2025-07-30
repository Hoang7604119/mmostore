import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { verifyToken } from '@/lib/utils'
import Product from '@/models/Product'
import AccountItem from '@/models/AccountItem'

interface DeleteProductOptions {
  allowedRoles: string[]
  checkOwnership?: boolean
}

export async function deleteProduct(
  request: NextRequest,
  options: DeleteProductOptions
): Promise<NextResponse> {
  try {
    await connectDB()
    
    // Verify token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || !options.allowedRoles.includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { productId } = await request.json()

    // Validation
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID là bắt buộc' },
        { status: 400 }
      )
    }

    // Find product
    const product = await Product.findById(productId)
    if (!product) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      )
    }

    // Check ownership if required
    if (options.checkOwnership && decoded.role === 'seller') {
      if (product.sellerId.toString() !== decoded.userId) {
        return NextResponse.json(
          { error: 'Bạn không có quyền xóa sản phẩm này' },
          { status: 403 }
        )
      }
    }

    // Delete associated account items first
    await AccountItem.deleteMany({ productId: productId })
    
    // Then delete the product
    await Product.findByIdAndDelete(productId)

    return NextResponse.json(
      { message: 'Xóa sản phẩm thành công' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import AccountItem from '@/models/AccountItem'
import { verifyToken } from '@/lib/utils'
import { notifyProductApproved, notifyProductRejected } from '@/utils/notificationHelpers'
import { deleteProduct } from '@/lib/productUtils'

export const dynamic = 'force-dynamic'

// GET - Lấy tất cả sản phẩm (manager)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify manager token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || !['admin', 'manager'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    // Get all products with seller info
    const products = await Product.find({})
      .populate('sellerId', 'username email')
      .sort({ createdAt: -1 })

    return NextResponse.json({ products }, { status: 200 })

  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// PUT - Cập nhật sản phẩm (manager)
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify manager token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || !['admin', 'manager'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { productId, type, credentials, price, description, status, rejectionReason } = body

    // Validation
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID là bắt buộc' },
        { status: 400 }
      )
    }

    // Find product
    const product = await Product.findById(productId).populate('sellerId', 'username email _id')
    if (!product) {
      return NextResponse.json(
        { error: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      )
    }

    // Store old status for notification comparison
    const oldStatus = product.status

    // Prepare update data
    const updateData: any = {}
    if (type !== undefined) updateData.type = type
    if (credentials !== undefined) updateData.credentials = credentials
    if (price !== undefined) updateData.price = price
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    ).populate('sellerId', 'username email _id')

    // Send notifications for status changes
    if (status && status !== oldStatus && product.sellerId) {
      try {
        if (status === 'approved' && oldStatus !== 'approved') {
          await notifyProductApproved(
            product.sellerId._id.toString(),
            product.title
          )
        } else if (status === 'rejected' && oldStatus !== 'rejected') {
          const reason = rejectionReason || 'Sản phẩm không đáp ứng yêu cầu của hệ thống'
          await notifyProductRejected(
            product.sellerId._id.toString(),
            product.title,
            reason
          )
        }
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError)
        // Don't fail the main operation if notification fails
      }
    }

    return NextResponse.json(
      { 
        message: 'Cập nhật sản phẩm thành công',
        product: updatedProduct
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Update product error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// DELETE - Xóa sản phẩm (manager)
export async function DELETE(request: NextRequest) {
  return deleteProduct(request, {
    allowedRoles: ['admin', 'manager'],
    checkOwnership: false
  })
}

// POST - Tạo sản phẩm mới (manager)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify manager token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || !['admin', 'manager'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { type, title, description, pricePerUnit, category, accounts } = body

    // Validation
    if (!type || !title || !pricePerUnit || !category || !accounts || !Array.isArray(accounts)) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    if (accounts.length === 0) {
      return NextResponse.json(
        { error: 'Phải có ít nhất 1 tài khoản' },
        { status: 400 }
      )
    }

    // Validate accounts format
    for (const account of accounts) {
      if (!account.data || typeof account.data !== 'string') {
        return NextResponse.json(
          { error: 'Mỗi tài khoản phải có dữ liệu (data)' },
          { status: 400 }
        )
      }
      
      if (!account.fields || !Array.isArray(account.fields) || account.fields.length === 0) {
        return NextResponse.json(
          { error: 'Mỗi tài khoản phải có định nghĩa các trường (fields)' },
          { status: 400 }
        )
      }
      
      const dataParts = account.data.split('|')
      if (dataParts.length !== account.fields.length) {
        return NextResponse.json(
          { error: 'Số lượng dữ liệu không khớp với số trường đã định nghĩa' },
          { status: 400 }
        )
      }
      
      // Kiểm tra không có trường nào trống
      for (const part of dataParts) {
        if (!part.trim()) {
          return NextResponse.json(
            { error: 'Không được để trống bất kỳ trường nào trong dữ liệu tài khoản' },
            { status: 400 }
          )
        }
      }
    }

    // Check for duplicate accounts in the system (based on data string)
    const existingAccounts = await AccountItem.find({
      accountData: { $in: accounts.map(acc => acc.data) }
    })

    if (existingAccounts.length > 0) {
      return NextResponse.json(
        { error: `Phát hiện ${existingAccounts.length} tài khoản đã tồn tại trong hệ thống` },
        { status: 400 }
      )
    }

    // Normalize type to handle case sensitivity (X -> x)
    const normalizedType = type === 'X' ? 'x' : type

    // Create product
    const product = new Product({
      type: normalizedType,
      title,
      description,
      quantity: accounts.length,
      pricePerUnit,
      category,
      sellerId: decoded.userId,
      status: 'approved', // Manager/admin tạo sản phẩm sẽ được duyệt luôn
      soldCount: 0,
      rating: 0,
      reviewCount: 0
    })

    await product.save()

    // Create account items
    const accountItems = accounts.map(account => {
      const dataParts = account.data.split('|')
      const accountObject: any = {
        productId: product._id,
        accountData: account.data,
        fieldNames: account.fields,
        status: 'available'
      }
      
      // For backward compatibility, try to map to existing fields
      account.fields.forEach((fieldName: string, index: number) => {
        const value = dataParts[index]?.trim()
        if (value) {
          switch (fieldName.toLowerCase()) {
            case 'username':
            case 'user':
            case 'email':
            case 'mail':
              accountObject.username = value
              if (fieldName.toLowerCase().includes('email') || fieldName.toLowerCase().includes('mail')) {
                accountObject.email = value
              }
              break
            case 'password':
            case 'pass':
              accountObject.password = value
              break
            default:
              // Store other fields in additionalInfo as JSON
              if (!accountObject.additionalInfo) {
                accountObject.additionalInfo = {}
              }
              accountObject.additionalInfo[fieldName] = value
          }
        }
      })
      
      // Ensure required fields have fallback values
      if (!accountObject.username && dataParts[0]) {
        accountObject.username = dataParts[0].trim()
      }
      if (!accountObject.password && dataParts[1]) {
        accountObject.password = dataParts[1].trim()
      }
      
      // Convert additionalInfo to string if it exists
      if (accountObject.additionalInfo && typeof accountObject.additionalInfo === 'object') {
        accountObject.additionalInfo = JSON.stringify(accountObject.additionalInfo)
      }
      
      return accountObject
    })

    await AccountItem.insertMany(accountItems)

    return NextResponse.json(
      { 
        message: 'Tạo sản phẩm thành công',
        product: {
          ...product.toObject(),
          totalAccounts: accounts.length,
          availableAccounts: accounts.length,
          soldAccounts: 0
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
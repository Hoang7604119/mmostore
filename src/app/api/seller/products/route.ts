import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import AccountItem from '@/models/AccountItem'
import { verifyToken } from '@/lib/utils'
import { notifyProductCreated } from '@/utils/notificationHelpers'
import { deleteProduct } from '@/lib/productUtils'

export const dynamic = 'force-dynamic'

// GET - Lấy sản phẩm của seller
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Get token from cookies
    const token = request.cookies.get('token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Không có token' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 401 }
      )
    }

    if (!['seller', 'manager', 'admin'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    // Build query
    const query: any = { sellerId: decoded.userId }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (status && status !== 'all') {
      query.status = status
    }

    // Get total count and status statistics
    const totalProducts = await Product.countDocuments({ sellerId: decoded.userId })
    const pendingCount = await Product.countDocuments({ sellerId: decoded.userId, status: 'pending' })
    const approvedCount = await Product.countDocuments({ sellerId: decoded.userId, status: 'approved' })
    const rejectedCount = await Product.countDocuments({ sellerId: decoded.userId, status: 'rejected' })
    
    const filteredTotal = await Product.countDocuments(query)
    const totalPages = Math.ceil(filteredTotal / limit)
    const skip = (page - 1) * limit

    // Get products for this seller with pagination
    const products = await Product.find(query)
      .populate('sellerId', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Get account counts for each product
    const productsWithCounts = await Promise.all(
      products.map(async (product) => {
        const totalAccounts = await AccountItem.countDocuments({ productId: product._id })
        const availableAccounts = await AccountItem.countDocuments({ 
          productId: product._id, 
          status: 'available' 
        })
        const soldAccounts = await AccountItem.countDocuments({ 
          productId: product._id, 
          status: 'sold' 
        })
        
        return {
          ...product.toObject(),
          totalAccounts,
          availableAccounts,
          soldAccounts
        }
      })
    )

    return NextResponse.json({ 
      products: productsWithCounts,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts: filteredTotal,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      statistics: {
        totalProducts,
        pendingCount,
        approvedCount,
        rejectedCount
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Get seller products error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// POST - Tạo sản phẩm mới
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify seller token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || (decoded.role !== 'seller' && decoded.role !== 'manager' && decoded.role !== 'admin')) {
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
    const accountDataList = accounts.map(acc => acc.data)
    
    const existingAccounts = await AccountItem.find({
      accountData: { $in: accountDataList }
    })

    if (existingAccounts.length > 0) {
      return NextResponse.json(
        { error: `Phát hiện ${existingAccounts.length} tài khoản đã tồn tại trong hệ thống` },
        { status: 400 }
      )
    }

    // Normalize type to handle case sensitivity (X -> x)
    const normalizedType = type === 'X' ? 'x' : type

    // Determine product status based on user role
    const productStatus = ['admin', 'manager'].includes(decoded.role) ? 'approved' : 'pending'

    // Create product
    const productData = {
      type: normalizedType,
      title,
      description,
      quantity: accounts.length,
      pricePerUnit,
      category,
      sellerId: decoded.userId,
      status: productStatus,
      soldCount: 0,
      rating: 0,
      reviewCount: 0
    }
    
    const product = new Product(productData)
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

    // Send notification about product creation
    try {
      await notifyProductCreated(
        decoded.userId,
        product.title,
        productStatus,
        product._id.toString()
      )
    } catch (notificationError) {
      console.error('Error sending product creation notification:', notificationError)
      // Don't fail the main operation if notification fails
    }

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

// DELETE - Xóa sản phẩm của seller
export async function DELETE(request: NextRequest) {
  return deleteProduct(request, {
    allowedRoles: ['seller', 'manager', 'admin'],
    checkOwnership: true
  })
}
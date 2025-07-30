import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import AccountItem from '@/models/AccountItem'
import { verifyToken } from '@/lib/utils'
import { deleteProduct } from '@/lib/productUtils'

export const dynamic = 'force-dynamic'

// GET - Lấy tất cả sản phẩm (admin)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify admin token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    // Get all products with seller info and account counts
    const products = await Product.find({})
      .populate('sellerId', 'username email')
      .sort({ createdAt: -1 })
      .lean()

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
          ...product,
          totalAccounts,
          availableAccounts,
          soldAccounts
        }
      })
    )

    return NextResponse.json({ products: productsWithCounts }, { status: 200 })

  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// PUT - Cập nhật sản phẩm (admin)
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify admin token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { productId, type, title, description, pricePerUnit, category, status } = body

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

    // Prepare update data
    const updateData: any = {}
    if (type !== undefined) updateData.type = type
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (pricePerUnit !== undefined) updateData.pricePerUnit = pricePerUnit
    if (category !== undefined) updateData.category = category
    if (status !== undefined) updateData.status = status

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    ).populate('sellerId', 'username email')

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

// DELETE - Xóa sản phẩm (admin)
export async function DELETE(request: NextRequest) {
  return deleteProduct(request, {
    allowedRoles: ['admin'],
    checkOwnership: false
  })
}

// POST - Tạo sản phẩm mới (admin)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify admin token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { type, title, description, pricePerUnit, quantity, category, sellerId, accounts } = await request.json()

    // Validation
    if (!type || !title || !pricePerUnit || !quantity || !sellerId || !accounts) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      )
    }

    if (!Array.isArray(accounts) || accounts.length === 0) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp ít nhất một tài khoản' },
        { status: 400 }
      )
    }

    if (accounts.length !== quantity) {
      return NextResponse.json(
        { error: 'Số lượng tài khoản không khớp với số lượng khai báo' },
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

    // Normalize type (convert 'X' to 'x')
    const normalizedType = type === 'X' ? 'x' : type

    // Create product
    const product = await Product.create({
      type: normalizedType,
      title,
      description,
      pricePerUnit,
      quantity,
      category: category || normalizedType,
      sellerId,
      status: 'approved' // Admin tạo sản phẩm sẽ được duyệt luôn
    })

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
      const additionalInfoObj: any = {}
      
      account.fields.forEach((fieldName: string, index: number) => {
        const value = dataParts[index]?.trim()
        if (value) {
          switch (fieldName.toLowerCase()) {
            case 'username':
            case 'user':
              accountObject.username = value
              break
            case 'email':
            case 'mail':
              accountObject.email = value
              break
            case 'password':
            case 'pass':
              accountObject.password = value
              break
            default:
              // Store other fields in additionalInfo
              additionalInfoObj[fieldName] = value
              break
          }
        }
      })
      
      // Convert additionalInfo to JSON string if it has properties
      if (Object.keys(additionalInfoObj).length > 0) {
        accountObject.additionalInfo = JSON.stringify(additionalInfoObj)
      }
      
      return accountObject
    })

    await AccountItem.insertMany(accountItems)

    const populatedProduct = await Product.findById(product._id)
      .populate('sellerId', 'username email')

    return NextResponse.json(
      { 
        message: 'Tạo sản phẩm thành công',
        product: populatedProduct
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
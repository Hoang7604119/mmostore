import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ProductType from '@/models/ProductType'
import { verifyToken } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET - Lấy danh sách tất cả product types
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

    // Get all product types sorted by order and displayName
    const productTypes = await ProductType.find({}).sort({ order: 1, displayName: 1 })

    return NextResponse.json({ productTypes }, { status: 200 })

  } catch (error) {
    console.error('Get product types error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// POST - Tạo product type mới
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

    const { name, displayName, color, image, description, order } = await request.json()

    // Validation
    if (!name || !displayName || !color) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin bắt buộc' },
        { status: 400 }
      )
    }

    // Check if name already exists
    const existingType = await ProductType.findOne({ name: name.toLowerCase() })
    if (existingType) {
      return NextResponse.json(
        { error: 'Tên loại sản phẩm đã tồn tại' },
        { status: 400 }
      )
    }

    // Validate color format
    const colorRegex = /^#[0-9A-F]{6}$/i
    if (!colorRegex.test(color)) {
      return NextResponse.json(
        { error: 'Màu sắc phải có định dạng hex (ví dụ: #FF0000)' },
        { status: 400 }
      )
    }

    // Create new product type
    const newProductType = await ProductType.create({
      name: name.toLowerCase(),
      displayName,
      icon: displayName.charAt(0).toUpperCase(), // Auto-generate icon from first letter
      color,
      image,
      description,
      order: order || 0
    })

    return NextResponse.json(
      { 
        message: 'Tạo loại sản phẩm thành công',
        productType: newProductType
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Create product type error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// PUT - Cập nhật product type
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

    const { id, name, displayName, color, image, description, order, isActive } = await request.json()

    // Validation
    if (!id) {
      return NextResponse.json(
        { error: 'ID là bắt buộc' },
        { status: 400 }
      )
    }

    // Find product type
    const productType = await ProductType.findById(id)
    if (!productType) {
      return NextResponse.json(
        { error: 'Không tìm thấy loại sản phẩm' },
        { status: 404 }
      )
    }

    // Check if new name already exists (excluding current record)
    if (name && name.toLowerCase() !== productType.name) {
      const existingType = await ProductType.findOne({ 
        name: name.toLowerCase(),
        _id: { $ne: id }
      })
      if (existingType) {
        return NextResponse.json(
          { error: 'Tên loại sản phẩm đã tồn tại' },
          { status: 400 }
        )
      }
    }

    // Validate color format if provided
    if (color) {
      const colorRegex = /^#[0-9A-F]{6}$/i
      if (!colorRegex.test(color)) {
        return NextResponse.json(
          { error: 'Màu sắc phải có định dạng hex (ví dụ: #FF0000)' },
          { status: 400 }
        )
      }
    }

    // Update product type
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.toLowerCase()
    if (displayName !== undefined) {
      updateData.displayName = displayName
      updateData.icon = displayName.charAt(0).toUpperCase() // Auto-update icon from first letter
    }
    if (color !== undefined) updateData.color = color
    if (image !== undefined) updateData.image = image
    if (description !== undefined) updateData.description = description
    if (order !== undefined) updateData.order = order
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedProductType = await ProductType.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )

    return NextResponse.json(
      { 
        message: 'Cập nhật loại sản phẩm thành công',
        productType: updatedProductType
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Update product type error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// DELETE - Xóa product type
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID là bắt buộc' },
        { status: 400 }
      )
    }

    // Find product type
    const productType = await ProductType.findById(id)
    if (!productType) {
      return NextResponse.json(
        { error: 'Không tìm thấy loại sản phẩm' },
        { status: 404 }
      )
    }

    // TODO: Check if there are products using this type
    // const Product = require('@/models/Product')
    // const productsCount = await Product.countDocuments({ type: productType.name })
    // if (productsCount > 0) {
    //   return NextResponse.json(
    //     { error: `Không thể xóa vì có ${productsCount} sản phẩm đang sử dụng loại này` },
    //     { status: 400 }
    //   )
    // }

    await ProductType.findByIdAndDelete(id)

    return NextResponse.json(
      { message: 'Xóa loại sản phẩm thành công' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Delete product type error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
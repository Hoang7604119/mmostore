import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/utils'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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

    // Get user from database
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy user' },
        { status: 404 }
      )
    }

    // Check if user is buyer
    if (user.role !== 'buyer') {
      return NextResponse.json(
        { error: 'Chỉ buyer mới có thể gửi yêu cầu trở thành seller' },
        { status: 403 }
      )
    }

    // Check if user already has a pending or approved request
    if (user.sellerRequest) {
      if (user.sellerRequest.status === 'pending') {
        return NextResponse.json(
          { error: 'Bạn đã có yêu cầu đang chờ duyệt' },
          { status: 400 }
        )
      }
      
      if (user.sellerRequest.status === 'approved') {
        return NextResponse.json(
          { error: 'Yêu cầu của bạn đã được duyệt' },
          { status: 400 }
        )
      }
    }

    // Create seller request
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        sellerRequest: {
          status: 'pending',
          requestedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('-password')

    return NextResponse.json(
      { 
        message: 'Gửi yêu cầu trở thành seller thành công',
        user: {
          _id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          credit: updatedUser.credit || 0,
          sellerRequest: updatedUser.sellerRequest,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Seller request error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    // Get user from database
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy user' },
        { status: 404 }
      )
    }

    // Check if user has a seller request
    if (!user.sellerRequest) {
      return NextResponse.json(
        { error: 'Bạn chưa có yêu cầu nào' },
        { status: 400 }
      )
    }

    // Only allow canceling pending requests
    if (user.sellerRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Chỉ có thể hủy yêu cầu đang chờ duyệt' },
        { status: 400 }
      )
    }

    // Remove seller request
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $unset: { sellerRequest: 1 }
      },
      { new: true, runValidators: true }
    ).select('-password')

    return NextResponse.json(
      { 
        message: 'Hủy yêu cầu thành công',
        user: {
          _id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          credit: updatedUser.credit || 0,
          sellerRequest: updatedUser.sellerRequest,
          createdAt: updatedUser.createdAt,
          updatedUser: updatedUser.updatedAt
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Cancel seller request error:', error)
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    )
  }
}
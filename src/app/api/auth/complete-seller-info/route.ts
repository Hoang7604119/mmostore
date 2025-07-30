import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { verifyToken } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
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
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 401 }
      )
    }

    // Get request body
    const { personalInfo, bankAccount } = await request.json()

    // Validate required fields
    if (!personalInfo?.fullName || !personalInfo?.phoneNumber || !personalInfo?.address ||
        !bankAccount?.bankName || !bankAccount?.accountNumber || !bankAccount?.accountHolder) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin bắt buộc' },
        { status: 400 }
      )
    }

    // Find user
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy người dùng' },
        { status: 404 }
      )
    }

    // Check if user has pending seller request
    if (!user.sellerRequest || user.sellerRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Không tìm thấy yêu cầu seller đang chờ duyệt' },
        { status: 400 }
      )
    }

    // Update seller request with personal info and bank account
    user.sellerRequest.personalInfo = {
      fullName: personalInfo.fullName.trim(),
      phoneNumber: personalInfo.phoneNumber.trim(),
      address: personalInfo.address.trim(),
      idNumber: personalInfo.idNumber?.trim() || ''
    }

    user.sellerRequest.bankAccount = {
      bankName: bankAccount.bankName.trim(),
      accountNumber: bankAccount.accountNumber.trim(),
      accountHolder: bankAccount.accountHolder.trim(),
      branch: bankAccount.branch?.trim() || ''
    }

    await user.save()

    return NextResponse.json(
      { 
        message: 'Thông tin đã được cập nhật thành công',
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          credit: user.credit || 0,
          sellerRequest: user.sellerRequest
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Complete seller info error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
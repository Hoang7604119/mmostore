import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import EmailVerification from '@/models/EmailVerification'
import { isValidVerificationCode } from '@/lib/emailVerification'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { email, code } = await request.json()

    // Validation
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email và mã xác thực là bắt buộc' },
        { status: 400 }
      )
    }

    // Validate code format
    if (!isValidVerificationCode(code)) {
      return NextResponse.json(
        { error: 'Mã xác thực không hợp lệ' },
        { status: 400 }
      )
    }

    // Find verification record
    const verification = await EmailVerification.findOne({
      email,
      code,
      isUsed: false
    })

    if (!verification) {
      return NextResponse.json(
        { error: 'Mã xác thực không đúng hoặc đã được sử dụng' },
        { status: 400 }
      )
    }

    // Check if expired
    if (verification.isExpired()) {
      await EmailVerification.deleteOne({ _id: verification._id })
      return NextResponse.json(
        { error: 'Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.' },
        { status: 400 }
      )
    }

    // Check attempts
    verification.attempts += 1
    
    if (verification.hasMaxAttemptsReached()) {
      await EmailVerification.deleteOne({ _id: verification._id })
      return NextResponse.json(
        { error: 'Đã vượt quá số lần thử. Vui lòng yêu cầu mã mới.' },
        { status: 400 }
      )
    }

    await verification.save()

    // Mark as used
    verification.isUsed = true
    await verification.save()

    return NextResponse.json(
      { 
        message: 'Xác thực thành công',
        verified: true
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
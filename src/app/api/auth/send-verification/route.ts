import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import EmailVerification from '@/models/EmailVerification'
import { generateVerificationCode, sendVerificationEmail } from '@/lib/emailVerification'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { email } = await request.json()

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email là bắt buộc' },
        { status: 400 }
      )
    }

    // Check if email is valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      )
    }

    // Check for existing verification code
    const existingVerification = await EmailVerification.findOne({ 
      email,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    })

    if (existingVerification) {
      // Check if too many recent attempts
      const recentAttempts = await EmailVerification.countDocuments({
        email,
        createdAt: { $gt: new Date(Date.now() - 60 * 1000) } // Last minute
      })

      if (recentAttempts >= 3) {
        return NextResponse.json(
          { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 phút.' },
          { status: 429 }
        )
      }
    }

    // Generate new verification code
    const code = generateVerificationCode()

    // Delete old verification codes for this email
    await EmailVerification.deleteMany({ email })

    // Create new verification record
    await EmailVerification.create({
      email,
      code,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    })

    // Send verification email
    const emailSent = await sendVerificationEmail(email, code)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Không thể gửi email. Vui lòng thử lại.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Mã xác thực đã được gửi đến email của bạn',
        expiresIn: 600 // 10 minutes in seconds
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Send verification error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

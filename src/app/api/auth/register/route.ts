import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import EmailVerification from '@/models/EmailVerification'
import { hashPassword } from '@/lib/utils'
import { validatePassword } from '@/lib/passwordValidation'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { username, email, password, verificationCode } = await request.json()

    // Validation
    if (!username || !email || !password || !verificationCode) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      )
    }

    // Verify email verification code
    const verification = await EmailVerification.findOne({
      email,
      code: verificationCode,
      isUsed: true, // Must be verified first
      expiresAt: { $gt: new Date() }
    })

    if (!verification) {
      return NextResponse.json(
        { error: 'Mã xác thực không hợp lệ hoặc chưa được xác thực' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email hoặc tên đăng nhập đã tồn tại' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'buyer' // Default role
    })

    // Clean up verification record
    await EmailVerification.deleteMany({ email })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject()

    return NextResponse.json(
      { 
        message: 'Đăng ký thành công',
        user: userWithoutPassword
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
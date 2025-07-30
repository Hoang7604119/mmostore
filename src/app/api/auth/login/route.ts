import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { verifyPassword, generateToken } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { email, password } = await request.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      )
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Tài khoản đã bị khóa' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    // Generate token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject()

    // Create response with cookie
    const response = NextResponse.json(
      { 
        message: 'Đăng nhập thành công',
        user: userWithoutPassword,
        token
      },
      { status: 200 }
    )

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
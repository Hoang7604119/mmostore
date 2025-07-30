import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

// GET - Lấy thông tin credit của user hiện tại
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await User.findById(decoded.userId, { password: 0 })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      credit: user.credit,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        credit: user.credit
      }
    })
  } catch (error) {
    console.error('Error fetching user credit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
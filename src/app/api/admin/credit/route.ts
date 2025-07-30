import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import { notifyCreditUpdated } from '@/utils/notificationHelpers'

export const dynamic = 'force-dynamic'

// GET - Lấy danh sách user và credit
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify admin token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await User.findById(decoded.userId)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all users with their credit
    const users = await User.find(
      { role: { $ne: 'admin' } },
      { password: 0 }
    ).sort({ createdAt: -1 })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Thêm credit cho user
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify admin token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const adminUser = await User.findById(decoded.userId)
    
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, amount, action } = await request.json()

    if (!userId || !amount || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    }

    if (!['add', 'subtract'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const oldCredit = user.credit
    
    if (action === 'add') {
      user.credit += amount
    } else {
      if (user.credit < amount) {
        return NextResponse.json({ error: 'Insufficient credit' }, { status: 400 })
      }
      user.credit -= amount
    }

    await user.save()

    // Send notification to user about credit change
    try {
      await notifyCreditUpdated(
        userId,
        action === 'add' ? 'added' : 'subtracted',
        amount,
        user.credit,
        'Admin điều chỉnh credit'
      )
    } catch (notificationError) {
      console.error('Error sending credit notification:', notificationError)
      // Don't fail the main operation if notification fails
    }

    return NextResponse.json({ 
      message: `Credit ${action === 'add' ? 'added' : 'subtracted'} successfully`,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        credit: user.credit
      }
    })
  } catch (error) {
    console.error('Error updating credit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
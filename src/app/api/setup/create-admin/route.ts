import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// POST - Tạo admin user (chỉ dùng cho setup ban đầu)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Kiểm tra xem đã có admin user chưa
    const existingAdmin = await User.findOne({ role: 'admin' })
    
    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Admin user already exists',
        admin: {
          username: existingAdmin.username,
          email: existingAdmin.email,
          isActive: existingAdmin.isActive
        }
      }, { status: 400 })
    }
    
    // Tạo admin user mới
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      credit: 0
    })
    
    console.log('Admin user created:', adminUser._id)
    
    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      admin: {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role
      },
      credentials: {
        email: 'admin@example.com',
        password: 'admin123'
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Create admin error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create admin user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Kiểm tra admin users hiện tại
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const adminUsers = await User.find({ role: 'admin' })
      .select('username email role isActive createdAt')
      .sort({ createdAt: -1 })
    
    return NextResponse.json({
      success: true,
      adminCount: adminUsers.length,
      admins: adminUsers
    }, { status: 200 })
    
  } catch (error) {
    console.error('Get admin users error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get admin users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Withdrawal from '@/models/Withdrawal'
import User from '@/models/User'
import jwt from 'jsonwebtoken'
import { sendNotification } from '@/lib/notifications'

// GET - Lấy danh sách withdrawal requests
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Xác thực admin
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Không có token xác thực' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const user = await User.findById(decoded.userId)
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
    }

    // Lấy danh sách withdrawal requests với thông tin user
    const withdrawals = await Withdrawal.find({})
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(100)

    return NextResponse.json({ 
      success: true, 
      withdrawals 
    })

  } catch (error) {
    console.error('Error fetching withdrawals:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

// POST - Xử lý withdrawal request (approve/reject)
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Xác thực admin
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Không có token xác thực' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const adminUser = await User.findById(decoded.userId)
    
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 })
    }

    const { withdrawalId, action, adminNote } = await request.json()

    if (!withdrawalId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 })
    }

    // Tìm withdrawal request
    const withdrawal = await Withdrawal.findById(withdrawalId).populate('userId')
    if (!withdrawal) {
      return NextResponse.json({ error: 'Không tìm thấy yêu cầu rút tiền' }, { status: 404 })
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ error: 'Yêu cầu rút tiền đã được xử lý' }, { status: 400 })
    }

    if (action === 'approve') {
      // Duyệt yêu cầu rút tiền
      withdrawal.status = 'completed'
      withdrawal.adminNote = adminNote || 'Đã duyệt bởi admin'
      withdrawal.processedAt = new Date()
      withdrawal.processedBy = adminUser._id
      
      await withdrawal.save()
      
      // Notify user about withdrawal approval
      try {
        await sendNotification(
          'CREDIT_WITHDRAWN',
          withdrawal.userId._id.toString(),
          {
            amount: withdrawal.amount.toLocaleString('vi-VN'),
            processedDate: new Date().toLocaleDateString('vi-VN')
          },
          '/dashboard/credit'
        )
      } catch (notificationError) {
        console.error('Error sending withdrawal approval notification:', notificationError)
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Đã duyệt yêu cầu rút tiền thành công' 
      })
      
    } else if (action === 'reject') {
      // Từ chối yêu cầu rút tiền - hoàn lại credit cho user
      const user = await User.findById(withdrawal.userId._id)
      if (user) {
        user.credit += withdrawal.amount
        await user.save()
      }
      
      withdrawal.status = 'rejected'
      withdrawal.adminNote = adminNote || 'Từ chối bởi admin'
      withdrawal.processedAt = new Date()
      withdrawal.processedBy = adminUser._id
      
      await withdrawal.save()
      
      // Notify user about withdrawal rejection and credit refund
      try {
        await sendNotification(
          'WITHDRAWAL_FAILED',
          withdrawal.userId._id.toString(),
          {
            amount: withdrawal.amount.toLocaleString('vi-VN'),
            reason: withdrawal.adminNote,
            refundDate: new Date().toLocaleDateString('vi-VN')
          },
          '/dashboard/credit'
        )
      } catch (notificationError) {
        console.error('Error sending withdrawal rejection notification:', notificationError)
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Đã từ chối yêu cầu rút tiền và hoàn lại credit' 
      })
    }

  } catch (error) {
    console.error('Error processing withdrawal:', error)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
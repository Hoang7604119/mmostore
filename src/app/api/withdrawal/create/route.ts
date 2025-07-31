import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Withdrawal from '@/models/Withdrawal'
import { verifyToken } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// POST - Tạo yêu cầu rút tiền
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify user token
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

    // Get user info
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Người dùng không tồn tại' },
        { status: 404 }
      )
    }

    const { amount, bankAccount } = await request.json()
    
    // Validate amount
    if (!amount || amount < 50000) {
      return NextResponse.json(
        { error: 'Số tiền rút tối thiểu là 50,000 VNĐ' },
        { status: 400 }
      )
    }

    if (amount > 10000000) {
      return NextResponse.json(
        { error: 'Số tiền rút tối đa là 10,000,000 VNĐ' },
        { status: 400 }
      )
    }

    // Check if user has sufficient balance
    const userCredit = user.credit || 0
    if (userCredit < amount) {
      return NextResponse.json(
        { error: 'Số dư không đủ để thực hiện giao dịch' },
        { status: 400 }
      )
    }

    // Validate bank account info
    if (!bankAccount || !bankAccount.accountNumber || !bankAccount.accountName || !bankAccount.bankName) {
      return NextResponse.json(
        { error: 'Thông tin tài khoản ngân hàng không đầy đủ' },
        { status: 400 }
      )
    }

    // Check for pending withdrawals
    const pendingWithdrawal = await Withdrawal.findOne({
      userId: user._id,
      status: { $in: ['pending', 'processing'] }
    })

    if (pendingWithdrawal) {
      return NextResponse.json(
        { error: 'Bạn có yêu cầu rút tiền đang chờ xử lý. Vui lòng đợi hoàn tất trước khi tạo yêu cầu mới.' },
        { status: 400 }
      )
    }

    // Create withdrawal request
    const withdrawal = new Withdrawal({
      userId: user._id,
      amount: amount,
      bankAccount: {
        accountNumber: bankAccount.accountNumber.trim(),
        accountName: bankAccount.accountName.trim(),
        bankName: bankAccount.bankName.trim()
      },
      status: 'pending'
    })
    
    await withdrawal.save()
    
    // Deduct amount from user credit (hold the amount)
    await User.findByIdAndUpdate(
      user._id,
      { $inc: { credit: -amount } },
      { new: true }
    )
    
    console.log('Withdrawal request created:', {
      userId: user._id,
      username: user.username,
      amount: amount,
      withdrawalId: withdrawal._id,
      bankAccount: bankAccount
    })
    
    // Notify only admins about new withdrawal request (not managers)
    try {
      const adminUsers = await User.find({ 
        role: 'admin',
        isActive: true 
      })

      // Send notification to each admin
      for (const admin of adminUsers) {
        await sendNotification(
          'WITHDRAWAL_REQUEST_CREATED',
          admin._id.toString(),
          {
            username: user.username,
            amount: amount.toLocaleString('vi-VN'),
            bankAccount: `${bankAccount.accountName} - ${bankAccount.bankName}`,
            requestDate: new Date().toLocaleDateString('vi-VN')
          },
          `/admin/credit?tab=withdrawals`
        )
      }
    } catch (notificationError) {
      console.error('Error sending withdrawal notification to admins:', notificationError)
      // Don't fail the main operation if notification fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Yêu cầu rút tiền đã được tạo thành công. Chúng tôi sẽ xử lý trong vòng 1-3 ngày làm việc.',
      data: {
        withdrawalId: withdrawal._id,
        amount: amount,
        status: 'pending',
        createdAt: withdrawal.createdAt
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Create withdrawal error:', error)
    return NextResponse.json(
      { error: 'Lỗi tạo yêu cầu rút tiền' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Withdrawal from '@/models/Withdrawal'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Lấy lịch sử rút tiền của người dùng
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    
    // Build query
    const query: any = { userId: decoded.userId }
    if (status && status !== 'all') {
      query.status = status
    }

    // Get withdrawals with pagination
    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()

    // Get total count
    const total = await Withdrawal.countDocuments(query)

    // Format response
    const formattedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal._id,
      amount: withdrawal.amount,
      status: withdrawal.status,
      bankAccount: withdrawal.bankAccount,
      adminNote: withdrawal.adminNote,
      createdAt: withdrawal.createdAt,
      updatedAt: withdrawal.updatedAt,
      processedAt: withdrawal.processedAt
    }))

    return NextResponse.json({
      success: true,
      data: {
        withdrawals: formattedWithdrawals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Get withdrawal history error:', error)
    return NextResponse.json(
      { error: 'Lỗi lấy lịch sử rút tiền' },
      { status: 500 }
    )
  }
}
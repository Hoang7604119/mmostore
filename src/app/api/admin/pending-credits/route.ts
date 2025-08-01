import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import PendingCredit from '@/models/PendingCredit'
import User from '@/models/User'
import Order from '@/models/Order'
import { verifyToken } from '@/lib/utils'
import mongoose from 'mongoose'
import { USER_ROLES } from '@/constants/roles'
import { PENDING_CREDIT_STATUS } from '@/constants/credit'

export const dynamic = 'force-dynamic'

// API để admin xem tất cả pending credits
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Verify admin token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Token không được cung cấp' },
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

    const user = await User.findById(decoded.userId)
    if (!user || user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const skip = (page - 1) * limit

    // Build filter
    const filter: any = {}
    if (status) filter.status = status
    if (userId) filter.userId = userId

    // Get pending credits with user info and order info
    const pendingCredits = await PendingCredit.find(filter)
      .populate('userId', 'username email role')
      .populate({
        path: 'orderId',
        select: 'orderNumber totalAmount',
        model: 'Order'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const total = await PendingCredit.countDocuments(filter)

    // Get statistics
    const stats = await PendingCredit.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ])

    return NextResponse.json({
      pendingCredits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    })

  } catch (error) {
    console.error('Error getting pending credits:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// API để admin thao tác với pending credits (approve, reject)
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Verify admin token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Token không được cung cấp' },
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

    const user = await User.findById(decoded.userId)
    if (!user || user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { creditId, action, adminNote } = await request.json()

    if (!creditId || !action) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    const pendingCredit = await PendingCredit.findById(creditId)
    if (!pendingCredit) {
      return NextResponse.json(
        { error: 'Không tìm thấy pending credit' },
        { status: 404 }
      )
    }

    if (pendingCredit.status !== PENDING_CREDIT_STATUS.PENDING) {
      return NextResponse.json(
        { error: 'Pending credit này đã được xử lý' },
        { status: 400 }
      )
    }

    const session = await mongoose.startSession()

    try {
      await session.withTransaction(async () => {
        if (action === 'approve') {
          // Duyệt credit
          await PendingCredit.findByIdAndUpdate(
            creditId,
            {
              status: PENDING_CREDIT_STATUS.RELEASED,
              actualReleaseDate: new Date(),
              note: adminNote ? `${pendingCredit.note} | Admin approve: ${adminNote}` : `${pendingCredit.note} | Admin approve`
            },
            { session }
          )

          // Chuyển credit từ pending sang available
          await User.findByIdAndUpdate(
            pendingCredit.userId,
            {
              $inc: {
                credit: pendingCredit.amount,
                pendingCredit: -pendingCredit.amount
              }
            },
            { session }
          )

        } else if (action === 'reject') {
          // Từ chối credit
          await PendingCredit.findByIdAndUpdate(
            creditId,
            {
              status: PENDING_CREDIT_STATUS.CANCELLED,
              actualReleaseDate: new Date(),
              note: adminNote ? `${pendingCredit.note} | Admin reject: ${adminNote}` : `${pendingCredit.note} | Admin reject`
            },
            { session }
          )

          // Trừ pending credit (không cộng vào available credit)
          await User.findByIdAndUpdate(
            pendingCredit.userId,
            {
              $inc: {
                pendingCredit: -pendingCredit.amount
              }
            },
            { session }
          )

        } else {
          throw new Error('Action không hợp lệ')
        }
      })
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Đã duyệt credit thành công' : 'Đã từ chối credit thành công'
    })

  } catch (error) {
    console.error('Error processing credit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// API để admin thao tác với pending credits (release sớm, cancel)
export async function PATCH(request: NextRequest) {
  try {
    await connectDB()

    // Verify admin token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Token không được cung cấp' },
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

    const user = await User.findById(decoded.userId)
    if (!user || user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { pendingCreditId, action, note } = await request.json()

    if (!pendingCreditId || !action) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    const pendingCredit = await PendingCredit.findById(pendingCreditId)
    if (!pendingCredit) {
      return NextResponse.json(
        { error: 'Không tìm thấy pending credit' },
        { status: 404 }
      )
    }

    if (pendingCredit.status !== PENDING_CREDIT_STATUS.PENDING) {
      return NextResponse.json(
        { error: 'Pending credit này đã được xử lý' },
        { status: 400 }
      )
    }

    const session = await mongoose.startSession()

    try {
      await session.withTransaction(async () => {
        if (action === 'release') {
          // Giải phóng credit sớm
          await PendingCredit.findByIdAndUpdate(
            pendingCreditId,
            {
              status: PENDING_CREDIT_STATUS.RELEASED,
              actualReleaseDate: new Date(),
              note: note ? `${pendingCredit.note} | Admin release: ${note}` : `${pendingCredit.note} | Admin release`
            },
            { session }
          )

          // Chuyển credit từ pending sang available
          await User.findByIdAndUpdate(
            pendingCredit.userId,
            {
              $inc: {
                credit: pendingCredit.amount,
                pendingCredit: -pendingCredit.amount
              }
            },
            { session }
          )

        } else if (action === 'cancel') {
          // Hủy pending credit
          await PendingCredit.findByIdAndUpdate(
            pendingCreditId,
            {
              status: PENDING_CREDIT_STATUS.CANCELLED,
              actualReleaseDate: new Date(),
              note: note ? `${pendingCredit.note} | Admin cancel: ${note}` : `${pendingCredit.note} | Admin cancel`
            },
            { session }
          )

          // Trừ pending credit (không cộng vào available credit)
          await User.findByIdAndUpdate(
            pendingCredit.userId,
            {
              $inc: {
                pendingCredit: -pendingCredit.amount
              }
            },
            { session }
          )

        } else {
          throw new Error('Action không hợp lệ')
        }
      })
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }

    return NextResponse.json({
      success: true,
      message: action === 'release' ? 'Đã giải phóng credit thành công' : 'Đã hủy pending credit thành công'
    })

  } catch (error) {
    console.error('Error updating pending credit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
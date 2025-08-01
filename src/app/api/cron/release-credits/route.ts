import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import PendingCredit from '@/models/PendingCredit'
import User from '@/models/User'
import mongoose from 'mongoose'
import { PENDING_CREDIT_STATUS } from '@/constants/credit'

export const dynamic = 'force-dynamic'

// API để giải phóng credit đã hết thời gian giam giữ
export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Kiểm tra authorization (chỉ cho phép cron job hoặc admin)
    const authHeader = request.headers.get('authorization')
    const vercelCronHeader = request.headers.get('authorization') // Vercel cron sử dụng header này
    const cronSecret = process.env.CRON_SECRET || 'default-cron-secret'
    

    
    // Cho phép Vercel cron (có header đặc biệt) hoặc manual cron với Bearer token
    const isVercelCron = request.headers.get('user-agent')?.includes('vercel-cron')
    const isAuthorizedManual = authHeader === `Bearer ${cronSecret}`
    
    if (!isVercelCron && !isAuthorizedManual) {

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = await mongoose.startSession()
    let releasedCount = 0
    let totalReleased = 0

    try {
      await session.withTransaction(async () => {
        // Tìm tất cả pending credits đã đến thời gian giải phóng
        const releasableCredits = await PendingCredit.find({
          status: PENDING_CREDIT_STATUS.PENDING,
          releaseDate: { $lte: new Date() }
        }).session(session)

        for (const pendingCredit of releasableCredits) {
          // Cập nhật trạng thái pending credit
          await PendingCredit.findByIdAndUpdate(
            pendingCredit._id,
            {
              status: PENDING_CREDIT_STATUS.RELEASED,
              actualReleaseDate: new Date()
            },
            { session }
          )

          // Chuyển credit từ pending sang available cho user
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

          releasedCount++
          totalReleased += pendingCredit.amount
        }
      })
    } catch (error) {
      console.error('Error releasing credits:', error)
      throw error
    } finally {
      await session.endSession()
    }

    return NextResponse.json({
      success: true,
      message: `Đã giải phóng ${releasedCount} credit records`,
      releasedCount,
      totalReleased
    })

  } catch (error) {
    console.error('Error in release credits cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// API để kiểm tra trạng thái pending credits (cho admin)
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Lấy thống kê pending credits
    const stats = await PendingCredit.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ])

    // Đếm số credit sắp được giải phóng (trong 24h tới)
    const tomorrow = new Date()
    tomorrow.setTime(tomorrow.getTime() + 24 * 60 * 60 * 1000)
    
    const upcomingReleases = await PendingCredit.countDocuments({
      status: PENDING_CREDIT_STATUS.PENDING,
      releaseDate: { $lte: tomorrow }
    })

    // Đếm số credit đã quá hạn nhưng chưa được giải phóng
    const overdueReleases = await PendingCredit.countDocuments({
      status: PENDING_CREDIT_STATUS.PENDING,
      releaseDate: { $lte: new Date() }
    })

    return NextResponse.json({
      stats,
      upcomingReleases,
      overdueReleases
    })

  } catch (error) {
    console.error('Error getting pending credits stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
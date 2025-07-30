import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

// GET - Lấy thống kê credit tổng của hệ thống
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

    // Thống kê credit theo role
    const creditStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          totalCredit: { $sum: '$credit' },
          userCount: { $sum: 1 },
          avgCredit: { $avg: '$credit' },
          maxCredit: { $max: '$credit' },
          minCredit: { $min: '$credit' }
        }
      }
    ])

    // Thống kê tổng toàn hệ thống
    const totalSystemStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalCredit: { $sum: '$credit' },
          totalUsers: { $sum: 1 },
          avgCredit: { $avg: '$credit' }
        }
      }
    ])

    // Top users có credit cao nhất
    const topCreditUsers = await User.find(
      { role: { $ne: 'admin' } },
      { username: 1, email: 1, role: 1, credit: 1 }
    )
    .sort({ credit: -1 })
    .limit(10)

    // Users có credit thấp nhất (có thể cần hỗ trợ)
    const lowCreditUsers = await User.find(
      { 
        role: { $ne: 'admin' },
        credit: { $lt: 50000 } // Dưới 50k VNĐ
      },
      { username: 1, email: 1, role: 1, credit: 1 }
    )
    .sort({ credit: 1 })
    .limit(10)

    // Phân phối credit theo khoảng
    const creditDistribution = await User.aggregate([
      {
        $match: { role: { $ne: 'admin' } }
      },
      {
        $bucket: {
          groupBy: '$credit',
          boundaries: [0, 100000, 500000, 1000000, 5000000, 10000000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            totalCredit: { $sum: '$credit' }
          }
        }
      }
    ])

    return NextResponse.json({
      creditStats,
      totalSystemStats: totalSystemStats[0] || {
        totalCredit: 0,
        totalUsers: 0,
        avgCredit: 0
      },
      topCreditUsers,
      lowCreditUsers,
      creditDistribution
    })
  } catch (error) {
    console.error('Error fetching credit stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { verifyToken } from '@/lib/utils'
import mongoose from 'mongoose'
import { notifyReportResolved, notifyRefundProcessed } from '@/utils/notificationHelpers'

// Import models
import User from '@/models/User'
import ProductType from '@/models/ProductType'
import Product from '@/models/Product'
import AccountItem from '@/models/AccountItem'
import Report from '@/models/Report'

export const dynamic = 'force-dynamic'

// GET - Lấy danh sách tất cả báo cáo (admin/manager)
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    
    // Verify admin/manager token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 403 }
      )
    }

    // Check if user is admin or manager
    const user = await User.findById(decoded.userId)
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const reportType = searchParams.get('reportType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build query
    const query: any = {}
    if (status && status !== 'all') {
      query.status = status
    }
    if (reportType && reportType !== 'all') {
      query.reportType = reportType
    }

    // Get reports with pagination - using lean() to avoid populate issues
    const reports = await Report.find(query)
      .lean()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit) as any[]

    // Manually populate required fields
    const populatedReports = await Promise.all(
      reports.map(async (report) => {
        const [reporter, seller, product, accountItem, resolvedBy] = await Promise.all([
          report.reporterId ? User.findById(report.reporterId).select('username email').lean() : null,
          report.sellerId ? User.findById(report.sellerId).select('username email').lean() : null,
          report.productId ? Product.findById(report.productId).select('title type category pricePerUnit').lean() : null,
          report.accountItemId ? AccountItem.findById(report.accountItemId).select('username email accountData').lean() : null,
          report.resolvedBy ? User.findById(report.resolvedBy).select('username').lean() : null
        ])

        return {
          ...report,
          reporterId: reporter,
          sellerId: seller,
          productId: product,
          accountItemId: accountItem,
          resolvedBy: resolvedBy
        }
      })
    )

    const total = await Report.countDocuments(query)

    // Get statistics
    const stats = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const statusStats = {
      pending: 0,
      investigating: 0,
      resolved: 0,
      rejected: 0
    }

    stats.forEach(stat => {
      statusStats[stat._id as keyof typeof statusStats] = stat.count
    })

    return NextResponse.json({
      reports: populatedReports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: statusStats
    }, { status: 200 })

  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// PUT - Cập nhật trạng thái báo cáo và xử lý hoàn tiền
export async function PUT(request: NextRequest) {
  try {
    await connectDB()
    
    
    // Verify admin/manager token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 403 }
      )
    }

    // Check if user is admin or manager
    const user = await User.findById(decoded.userId)
    if (!user || !['admin', 'manager'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      reportId, 
      status, 
      adminNote, 
      refundAmount, 
      processRefund,
      sellerPenalty 
    } = body

    // Validation
    if (!reportId || !status) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    const validStatuses = ['pending', 'investigating', 'resolved', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Trạng thái không hợp lệ' },
        { status: 400 }
      )
    }

    // Find report - using lean() to avoid populate issues
    const report = await Report.findById(reportId).lean() as any

    if (!report) {
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    // Start transaction for refund processing
    const session = await mongoose.startSession()
    
    try {
      await session.withTransaction(async () => {
        // Update report status
        const updateData: any = {
          status,
          adminNote: adminNote || '',
          resolvedBy: decoded.userId
        }

        if (status === 'resolved') {
          updateData.resolvedAt = new Date()
          
          // Process refund if requested
          if (processRefund && refundAmount && refundAmount > 0) {
            // Refund to buyer
            await User.findByIdAndUpdate(
              report.reporterId,
              { $inc: { credit: refundAmount } },
              { session }
            )

            // Deduct from seller
            await User.findByIdAndUpdate(
              report.sellerId,
              { $inc: { credit: -refundAmount } },
              { session }
            )

            updateData.refundAmount = refundAmount
            updateData.refundProcessed = true
          }

          // Apply seller penalty if specified
          if (sellerPenalty && sellerPenalty.type) {
            updateData.sellerPenalty = sellerPenalty

            // Apply credit deduction penalty
            if (sellerPenalty.type === 'credit_deduction' && sellerPenalty.amount) {
              await User.findByIdAndUpdate(
                report.sellerId,
                { $inc: { credit: -sellerPenalty.amount } },
                { session }
              )
            }

            // Apply ban penalty
            if (['temporary_ban', 'permanent_ban'].includes(sellerPenalty.type)) {
              const banUntil = sellerPenalty.type === 'permanent_ban' 
                ? new Date('2099-12-31') 
                : new Date(Date.now() + (sellerPenalty.duration || 7) * 24 * 60 * 60 * 1000)
              
              await User.findByIdAndUpdate(
                report.sellerId,
                { 
                  isActive: sellerPenalty.type !== 'permanent_ban',
                  banUntil: banUntil
                },
                { session }
              )
            }
          }
        }

        // Update report
        await Report.findByIdAndUpdate(
          reportId,
          updateData,
          { session }
        )
      })
    } catch (error) {
      throw error
    } finally {
      await session.endSession()
    }

    // Get updated report - using lean() to avoid populate issues
    const updatedReportRaw = await Report.findById(reportId).lean() as any
    
    // Manually populate required fields for updated report
    const [reporter, seller, product, resolvedBy] = await Promise.all([
      updatedReportRaw.reporterId ? User.findById(updatedReportRaw.reporterId).select('username email').lean() : null,
      updatedReportRaw.sellerId ? User.findById(updatedReportRaw.sellerId).select('username email').lean() : null,
      updatedReportRaw.productId ? Product.findById(updatedReportRaw.productId).select('title type').lean() : null,
      updatedReportRaw.resolvedBy ? User.findById(updatedReportRaw.resolvedBy).select('username').lean() : null
    ])
    
    const updatedReport = {
      ...updatedReportRaw,
      reporterId: reporter,
      sellerId: seller,
      productId: product,
      resolvedBy: resolvedBy
    }

    // Send notifications
    try {
      // Notify reporter about resolution
      await notifyReportResolved(
        report.reporterId.toString(),
        updatedReport.title,
        status,
        adminNote || '',
        updatedReport._id.toString()
      )

      // Notify about refund if processed
      if (processRefund && refundAmount && refundAmount > 0) {
        await notifyRefundProcessed(
          report.reporterId.toString(),
          refundAmount,
          updatedReport.title,
          updatedReport._id.toString()
        )
      }
    } catch (notificationError) {
      console.error('Error sending notifications:', notificationError)
    }

    return NextResponse.json({
      message: 'Cập nhật báo cáo thành công',
      report: updatedReport
    }, { status: 200 })

  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
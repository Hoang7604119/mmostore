import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Report from '@/models/Report'
import User from '@/models/User'
import Product from '@/models/Product'
import AccountItem from '@/models/AccountItem'
import { verifyToken } from '@/lib/utils'
import mongoose from 'mongoose'
import { notifyReportResolved } from '@/utils/notificationHelpers'

export const dynamic = 'force-dynamic'

// GET - Lấy thông tin chi tiết báo cáo theo ID
export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    await connectDB()
    
    // Verify token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('token')?.value
    
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

    const { reportId } = params

    // Validate reportId
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return NextResponse.json(
        { error: 'ID báo cáo không hợp lệ' },
        { status: 400 }
      )
    }

    // Find report
    const report = await Report.findById(reportId)
      .populate('reporterId', 'username email')
      .populate('productId', 'title type category price pricePerUnit')
      .populate('sellerId', 'username email')
      .populate('accountItemId', 'username email accountData')
      .populate('resolvedBy', 'username')

    if (!report) {
      return NextResponse.json(
        { error: 'Không tìm thấy báo cáo' },
        { status: 404 }
      )
    }

    // Check permissions
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Người dùng không tồn tại' },
        { status: 404 }
      )
    }

    // Allow access if:
    // 1. User is admin or manager
    // 2. User is the reporter (buyer)
    // 3. User is the seller (for their own products)
    const isAdminOrManager = ['admin', 'manager'].includes(user.role)
    const isReporter = report.reporterId._id.toString() === decoded.userId
    const isSeller = report.sellerId._id.toString() === decoded.userId

    if (!isAdminOrManager && !isReporter && !isSeller) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xem báo cáo này' },
        { status: 403 }
      )
    }

    // Format response based on user role
    const responseData = {
      _id: report._id,
      reportType: report.reportType,
      title: report.title,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt,
      resolvedAt: report.resolvedAt,
      productId: {
        _id: report.productId._id,
        title: report.productId.title,
        type: report.productId.type,
        category: report.productId.category,
        price: report.productId.pricePerUnit || report.productId.price || 0
      },
      sellerId: {
        _id: report.sellerId._id,
        username: report.sellerId.username,
        email: report.sellerId.email
      },
      buyerId: {
        _id: report.reporterId._id,
        username: report.reporterId.username,
        email: report.reporterId.email
      },
      accountItemId: {
        _id: report.accountItemId._id,
        username: report.accountItemId.username,
        email: report.accountItemId.email
      }
    }

    // Add admin/manager specific fields
    if (isAdminOrManager) {
      Object.assign(responseData, {
        adminNote: report.adminNote,
        refundAmount: report.refundAmount,
        refundProcessed: report.refundProcessed,
        sellerPenalty: report.sellerPenalty,
        resolvedBy: report.resolvedBy
      })
    }

    // Add limited admin info for reporters
    if (isReporter && report.status !== 'pending') {
      Object.assign(responseData, {
        adminNote: report.adminNote,
        refundAmount: report.refundAmount,
        refundProcessed: report.refundProcessed
      })
    }

    return NextResponse.json(responseData, { status: 200 })

  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// PUT - Cập nhật báo cáo (chỉ admin/manager)
export async function PUT(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    await connectDB()
    
    // Verify token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('token')?.value
    
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

    const { reportId } = params
    const body = await request.json()
    const { status, adminNote, refundAmount, refundProcessed } = body

    // Validation
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return NextResponse.json(
        { error: 'ID báo cáo không hợp lệ' },
        { status: 400 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Trạng thái là bắt buộc' },
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

    // Find report
    const report = await Report.findById(reportId)
      .populate('reporterId', 'username email credit')
      .populate('sellerId', 'username email credit')
      .populate('productId', 'title pricePerUnit')
      .populate('accountItemId')

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
        }

        // Process refund if requested
        if (refundAmount && parseFloat(refundAmount) > 0) {
          const refundAmountNum = parseFloat(refundAmount)
          
          // Refund to buyer
          await User.findByIdAndUpdate(
            report.reporterId._id,
            { $inc: { credit: refundAmountNum } },
            { session }
          )

          // Deduct from seller
          await User.findByIdAndUpdate(
            report.sellerId._id,
            { $inc: { credit: -refundAmountNum } },
            { session }
          )

          updateData.refundAmount = refundAmountNum
          updateData.refundProcessed = refundProcessed || true
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

    // Get updated report
    const updatedReport = await Report.findById(reportId)
      .populate('reporterId', 'username email')
      .populate('sellerId', 'username email')
      .populate('productId', 'title type category price pricePerUnit')
      .populate('accountItemId', 'username email')
      .populate('resolvedBy', 'username')

    // Send notifications
    try {
      if (status === 'resolved' || status === 'rejected') {
        await notifyReportResolved(
          report.reporterId._id.toString(),
          updatedReport.title,
          status,
          adminNote || '',
          reportId
        )
      }
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError)
      // Don't fail the main operation if notification fails
    }

    // Format response
    const responseData = {
      _id: updatedReport._id,
      reportType: updatedReport.reportType,
      title: updatedReport.title,
      description: updatedReport.description,
      status: updatedReport.status,
      adminNote: updatedReport.adminNote,
      refundAmount: updatedReport.refundAmount,
      refundProcessed: updatedReport.refundProcessed,
      createdAt: updatedReport.createdAt,
      resolvedAt: updatedReport.resolvedAt,
      productId: {
        _id: updatedReport.productId._id,
        title: updatedReport.productId.title,
        type: updatedReport.productId.type,
        category: updatedReport.productId.category,
        price: updatedReport.productId.pricePerUnit || updatedReport.productId.price || 0
      },
      sellerId: {
        _id: updatedReport.sellerId._id,
        username: updatedReport.sellerId.username,
        email: updatedReport.sellerId.email
      },
      buyerId: {
        _id: updatedReport.reporterId._id,
        username: updatedReport.reporterId.username,
        email: updatedReport.reporterId.email
      },
      accountItemId: {
        _id: updatedReport.accountItemId._id,
        username: updatedReport.accountItemId.username,
        email: updatedReport.accountItemId.email
      },
      resolvedBy: updatedReport.resolvedBy
    }

    return NextResponse.json(responseData, { status: 200 })

  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
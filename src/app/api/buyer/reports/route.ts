import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'
import User from '@/models/User'
import AccountItem from '@/models/AccountItem'
import Report from '@/models/Report'
import { verifyToken } from '@/lib/utils'
import { notifyReportCreated } from '@/utils/notificationHelpers'

// POST - Tạo báo cáo sản phẩm
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Ensure models are registered
    Product
    User
    AccountItem
    Report
    
    // Verify buyer token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để báo cáo sản phẩm' },
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

    const body = await request.json()
    const { accountItemId, reportType, title, description, evidence } = body

    // Validation
    if (!accountItemId || !reportType || !title || !description) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin báo cáo' },
        { status: 400 }
      )
    }

    // Validate report type
    const validReportTypes = ['fake_account', 'wrong_info', 'not_working', 'scam', 'other']
    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json(
        { error: 'Loại báo cáo không hợp lệ' },
        { status: 400 }
      )
    }

    // Find account item and verify ownership
    const accountItem = await AccountItem.findById(accountItemId)
      .populate('productId', '_id title sellerId')
    
    if (!accountItem) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản' },
        { status: 404 }
      )
    }

    // Check if buyer actually bought this account
    if (accountItem.soldTo?.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Bạn chỉ có thể báo cáo tài khoản mà bạn đã mua' },
        { status: 403 }
      )
    }

    // Check if account is sold
    if (accountItem.status !== 'sold') {
      return NextResponse.json(
        { error: 'Chỉ có thể báo cáo tài khoản đã mua' },
        { status: 400 }
      )
    }

    // Check if report already exists
    const existingReport = await Report.findOne({
      reporterId: decoded.userId,
      accountItemId: accountItemId
    })

    if (existingReport) {
      return NextResponse.json(
        { error: 'Bạn đã báo cáo tài khoản này rồi' },
        { status: 400 }
      )
    }

    // Create report
    const report = new Report({
      reporterId: decoded.userId,
      productId: accountItem.productId._id,
      accountItemId: accountItemId,
      sellerId: accountItem.productId.sellerId,
      reportType,
      title: title.trim(),
      description: description.trim(),
      evidence: evidence || [],
      status: 'pending',
      refundProcessed: false
    })

    await report.save()

    // Populate report for response
    const populatedReport = await Report.findById(report._id)
      .populate('reporterId', 'username email')
      .populate('productId', 'title type')
      .populate('sellerId', 'username email')

    // Send notification to admins/managers
    try {
      // Get all admins and managers
      const adminUsers = await User.find({ 
        role: { $in: ['admin', 'manager'] },
        isActive: true 
      })

      // Notify each admin/manager
      for (const admin of adminUsers) {
        await notifyReportCreated(
          admin._id.toString(),
          populatedReport.title,
          populatedReport.reportType,
          populatedReport.reporterId.username,
          populatedReport._id.toString()
        )
      }
    } catch (notificationError) {
      console.error('Error sending report notifications:', notificationError)
      // Don't fail the main operation if notification fails
    }

    return NextResponse.json({
      message: 'Báo cáo đã được gửi thành công',
      report: populatedReport
    }, { status: 201 })

  } catch (error) {
    console.error('Create report error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// GET - Lấy danh sách báo cáo của buyer
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Ensure models are registered
    Product
    User
    AccountItem
    Report
    
    // Verify buyer token
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build query
    const query: any = { reporterId: decoded.userId }
    if (status && status !== 'all') {
      query.status = status
    }

    // Get reports with pagination
    const reports = await Report.find(query)
      .populate('productId', 'title type category')
      .populate('sellerId', 'username email')
      .populate('accountItemId', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const total = await Report.countDocuments(query)

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
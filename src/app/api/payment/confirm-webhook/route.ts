import { NextRequest, NextResponse } from 'next/server'
import { payOS, PAYOS_CONFIG } from '@/config/payos'
import { verifyToken } from '@/lib/auth'
import User from '@/models/User'
import connectDB from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// POST - Xác thực và cấu hình webhook URL cho PayOS
export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify admin token
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

    // Get user info to check role
    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Chỉ admin mới có thể thực hiện cấu hình webhook' },
        { status: 403 }
      )
    }

    const { webhookUrl } = await request.json()
    
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'webhookUrl is required' },
        { status: 400 }
      )
    }
    
    console.log('Confirming webhook URL:', webhookUrl)
    console.log('PayOS instance:', !!payOS)
    console.log('PayOS config check:', {
      hasClientId: !!PAYOS_CONFIG.CLIENT_ID,
      hasApiKey: !!PAYOS_CONFIG.API_KEY,
      hasChecksumKey: !!PAYOS_CONFIG.CHECKSUM_KEY
    })
    
    try {
      // Kiểm tra xem phương thức confirmWebhook có tồn tại không
      console.log('PayOS methods available:', Object.getOwnPropertyNames(payOS))
      console.log('confirmWebhook method exists:', typeof payOS.confirmWebhook)
      
      if (typeof payOS.confirmWebhook !== 'function') {
        throw new Error('confirmWebhook method is not available in this PayOS SDK version')
      }
      
      // Sử dụng PayOS SDK để xác thực và cấu hình webhook URL
      console.log('Calling payOS.confirmWebhook...')
      const result = await payOS.confirmWebhook(webhookUrl)
      
      console.log('Webhook confirmation result:', result)
      
      return NextResponse.json({
        success: true,
        message: 'Webhook URL đã được xác thực và cấu hình thành công',
        data: {
          webhookUrl: webhookUrl,
          result: result
        }
      })
      
    } catch (payosError: any) {
      console.error('PayOS webhook confirmation error:', payosError)
      
      return NextResponse.json({
        success: false,
        error: 'Lỗi xác thực webhook với PayOS',
        details: payosError.message || payosError.toString()
      }, { status: 400 })
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Webhook confirmation error:', errorMessage)
    
    return NextResponse.json({
      success: false,
      error: 'Lỗi server khi xác thực webhook',
      message: errorMessage
    }, { status: 500 })
  }
}

// GET - Kiểm tra trạng thái webhook hiện tại
export async function GET(request: NextRequest) {
  try {
    const webhookUrl = process.env.NODE_ENV === 'production' 
      ? 'https://mmostore.site/api/payment/webhook'
      : 'http://localhost:3000/api/payment/webhook'
    
    return NextResponse.json({
      success: true,
      data: {
        currentWebhookUrl: webhookUrl,
        environment: process.env.NODE_ENV,
        message: 'Sử dụng POST method để xác thực webhook URL với PayOS'
      }
    })
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({
      success: false,
      error: 'Lỗi khi lấy thông tin webhook',
      message: errorMessage
    }, { status: 500 })
  }
}
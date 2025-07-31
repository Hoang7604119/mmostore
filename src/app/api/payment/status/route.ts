import { NextRequest, NextResponse } from 'next/server'
import { payOS } from '@/config/payos'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Kiểm tra trạng thái thanh toán với query parameter
export async function GET(request: NextRequest) {
  try {
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

    // Get orderCode from query parameter
    const { searchParams } = new URL(request.url)
    const orderCode = searchParams.get('orderCode')
    
    if (!orderCode) {
      return NextResponse.json(
        { error: 'Mã đơn hàng không hợp lệ' },
        { status: 400 }
      )
    }

    // Get payment information from PayOS with retry logic
    let paymentInfo
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        paymentInfo = await payOS.getPaymentLinkInformation(parseInt(orderCode))
        break
      } catch (retryError: any) {
        retryCount++
        
        if (retryCount >= maxRetries) {
          console.error(`PayOS API failed after ${maxRetries} retries:`, retryError)
          return NextResponse.json(
            { 
              error: 'Không thể kiểm tra trạng thái thanh toán', 
              details: retryError.message,
              success: false,
              status: 'error'
            },
            { status: 500 }
          )
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
    }

    if (!paymentInfo) {
      return NextResponse.json(
        { 
          error: 'Không thể lấy thông tin thanh toán',
          success: false,
          status: 'error'
        },
        { status: 500 }
      )
    }

    // Return payment status
    const isPaid = paymentInfo.status === 'PAID'
    
    return NextResponse.json(
      {
        success: true,
        status: isPaid ? 'paid' : 'pending',
        data: {
          orderCode: paymentInfo.orderCode,
          amount: paymentInfo.amount,
          status: paymentInfo.status,
          createdAt: paymentInfo.createdAt,
          transactions: paymentInfo.transactions || []
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Payment status check error:', error)
    return NextResponse.json(
      { 
        error: 'Lỗi kiểm tra trạng thái thanh toán',
        success: false,
        status: 'error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
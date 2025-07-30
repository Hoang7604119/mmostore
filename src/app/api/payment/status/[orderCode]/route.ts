import { NextRequest, NextResponse } from 'next/server'
import { payOS } from '@/config/payos'
import { verifyToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET - Kiểm tra trạng thái thanh toán
export async function GET(
  request: NextRequest,
  { params }: { params: { orderCode: string } }
) {
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

    const { orderCode } = params
    
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
        
        // Handle rate limit error (429)
        if (retryError.message && retryError.message.includes('429')) {
          if (retryCount < maxRetries) {
            // Wait before retry (exponential backoff)
            const delay = Math.pow(2, retryCount) * 1000 // 2s, 4s, 8s
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          } else {
            return NextResponse.json(
              { error: 'Hệ thống đang quá tải, vui lòng thử lại sau ít phút' },
              { status: 429 }
            )
          }
        }
        
        // Re-throw other errors to be handled by outer catch
        throw retryError
      }
    }
    
    // Check if paymentInfo was successfully retrieved
    if (!paymentInfo) {
      return NextResponse.json(
        { error: 'Không thể lấy thông tin thanh toán' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        orderCode: paymentInfo.orderCode,
        amount: paymentInfo.amount,
        status: paymentInfo.status,
        createdAt: paymentInfo.createdAt,
        transactions: paymentInfo.transactions || []
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Get payment status error:', error)
    
    // Handle specific PayOS errors
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Không tìm thấy thông tin thanh toán' },
          { status: 404 }
        )
      }
      
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'Hệ thống đang quá tải, vui lòng thử lại sau ít phút' },
          { status: 429 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Lỗi kiểm tra trạng thái thanh toán' },
      { status: 500 }
    )
  }
}
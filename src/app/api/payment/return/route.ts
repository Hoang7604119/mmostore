import { NextRequest, NextResponse } from 'next/server'
import { payOS } from '@/config/payos'

export const dynamic = 'force-dynamic'

// GET - Xử lý return URL từ PayOS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderCode = searchParams.get('orderCode')
    const status = searchParams.get('status')
    
    if (!orderCode) {
      // Redirect to credit page with error
      return NextResponse.redirect(
        new URL('/dashboard/credit?status=error&message=missing_order_code', request.url)
      )
    }

    try {
      // Get payment information from PayOS
      const paymentInfo = await payOS.getPaymentLinkInformation(parseInt(orderCode))
      
      if (paymentInfo.status === 'PAID') {
        // Payment successful - redirect to credit page with success
        return NextResponse.redirect(
          new URL(`/dashboard/credit?status=success&orderCode=${orderCode}&amount=${paymentInfo.amount}`, request.url)
        )
      } else if (paymentInfo.status === 'CANCELLED') {
        // Payment cancelled
        return NextResponse.redirect(
          new URL(`/dashboard/credit?status=cancel&orderCode=${orderCode}`, request.url)
        )
      } else {
        // Payment pending or other status
        return NextResponse.redirect(
          new URL(`/dashboard/credit?status=pending&orderCode=${orderCode}`, request.url)
        )
      }
    } catch (paymentError) {
      console.error('Error getting payment info:', paymentError)
      
      // If we can't get payment info, redirect with error
      return NextResponse.redirect(
        new URL(`/dashboard/credit?status=error&orderCode=${orderCode}&message=payment_info_error`, request.url)
      )
    }

  } catch (error) {
    console.error('Return URL processing error:', error)
    
    // Redirect to credit page with general error
    return NextResponse.redirect(
      new URL('/dashboard/credit?status=error&message=processing_error', request.url)
    )
  }
}
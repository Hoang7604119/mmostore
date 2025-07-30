import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Xử lý cancel URL từ PayOS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderCode = searchParams.get('orderCode')
    
    // Redirect to credit page with cancel status
    const redirectUrl = orderCode 
      ? `/dashboard/credit?status=cancel&orderCode=${orderCode}`
      : '/dashboard/credit?status=cancel'
    
    return NextResponse.redirect(
      new URL(redirectUrl, request.url)
    )

  } catch (error) {
    console.error('Cancel URL processing error:', error)
    
    // Redirect to credit page with error
    return NextResponse.redirect(
      new URL('/dashboard/credit?status=error&message=cancel_processing_error', request.url)
    )
  }
}
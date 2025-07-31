import { NextRequest, NextResponse } from 'next/server'
import { payOS } from '@/config/payos'

export const dynamic = 'force-dynamic'

// Test endpoint để kiểm tra confirmWebhook mà không cần authentication
export async function POST(request: NextRequest) {
  try {
    const { webhookUrl } = await request.json()
    
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'webhookUrl is required' },
        { status: 400 }
      )
    }
    
    console.log('Testing webhook URL:', webhookUrl)
    console.log('PayOS instance exists:', !!payOS)
    console.log('PayOS confirmWebhook method exists:', typeof payOS.confirmWebhook)
    
    if (typeof payOS.confirmWebhook !== 'function') {
      return NextResponse.json(
        { error: 'confirmWebhook method not found in PayOS SDK' },
        { status: 500 }
      )
    }
    
    // Test gọi confirmWebhook
    const result = await payOS.confirmWebhook(webhookUrl)
    console.log('PayOS confirmWebhook result:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Webhook confirmed successfully',
      result: result
    })
    
  } catch (error: any) {
    console.error('Error confirming webhook:', error)
    return NextResponse.json(
      { 
        error: 'Failed to confirm webhook',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test webhook endpoint is working',
    payosExists: !!payOS,
    confirmWebhookExists: typeof payOS.confirmWebhook
  })
}
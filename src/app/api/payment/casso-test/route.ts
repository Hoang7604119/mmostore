import { NextRequest, NextResponse } from 'next/server'

// Simple test endpoint for Casso webhook testing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Casso test webhook received:', JSON.stringify(body, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook received successfully',
      timestamp: new Date().toISOString(),
      receivedData: body
    })
  } catch (error) {
    console.error('Casso test webhook error:', error)
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook endpoint is working',
      error: 'Could not parse JSON body, but endpoint is accessible'
    })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Casso test webhook endpoint is active',
    timestamp: new Date().toISOString(),
    status: 'ready'
  })
}
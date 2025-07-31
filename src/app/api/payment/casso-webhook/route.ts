import { NextRequest, NextResponse } from 'next/server'

// Simplified Casso webhook handler for testing
export async function POST(request: NextRequest) {
  try {
    // Log the request for debugging
    const body = await request.json()
    console.log('Casso webhook received:', JSON.stringify(body, null, 2))
    
    // Log headers
    const headers = Object.fromEntries(request.headers.entries())
    console.log('Request headers:', headers)
    
    // Always return success for now
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Casso webhook error:', error)
    // Even if there's an error parsing, return success
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received (with parsing error)',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ 
    message: 'Casso webhook endpoint is active (simplified)',
    timestamp: new Date().toISOString()
  })
}
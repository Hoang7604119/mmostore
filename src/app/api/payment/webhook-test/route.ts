import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Endpoint đơn giản để PayOS validate
export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] GET request to webhook-test endpoint`)
  console.log(`[${timestamp}] Request headers:`, Object.fromEntries(request.headers.entries()))
  console.log(`[${timestamp}] Request URL:`, request.url)
  
  return NextResponse.json(
    { 
      message: 'PayOS webhook test endpoint is active',
      timestamp: timestamp,
      url: request.url,
      status: 'ready'
    },
    { status: 200 }
  )
}

// POST - Endpoint đơn giản để PayOS validate
export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] POST request to webhook-test endpoint`)
  console.log(`[${timestamp}] Request headers:`, Object.fromEntries(request.headers.entries()))
  
  try {
    const body = await request.text()
    console.log(`[${timestamp}] Request body:`, body)
    
    // Trả về 200 OK cho mọi request để PayOS có thể validate
    return NextResponse.json(
      { 
        message: 'PayOS webhook test endpoint received request',
        timestamp: timestamp,
        received: true
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`[${timestamp}] Error processing webhook test:`, error)
    
    // Vẫn trả về 200 OK để PayOS có thể validate
    return NextResponse.json(
      { 
        message: 'PayOS webhook test endpoint received request with error',
        timestamp: timestamp,
        received: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 200 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'

// Fallback endpoint for Socket.IO when running on Vercel
// Since Vercel doesn't support Socket.IO with custom servers,
// this endpoint provides information about the limitation

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Socket.IO is not available on Vercel serverless environment',
    recommendation: 'Use polling-based updates or deploy to Railway/Render for full Socket.IO support',
    fallback: {
      enabled: false,
      reason: 'Vercel serverless functions do not support persistent WebSocket connections'
    },
    alternatives: [
      'Use Pusher for real-time features',
      'Implement polling-based message updates',
      'Deploy to Railway or Render for full Socket.IO support'
    ]
  }, { status: 200 })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: 'Socket.IO POST operations not supported on Vercel',
    message: 'Please use REST API endpoints for message operations'
  }, { status: 501 })
}
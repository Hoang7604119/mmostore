import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import mongoose from 'mongoose'

export async function GET() {
  try {
    // Check database connection
    await connectDB()
    
    // Get database status
    const dbState = mongoose.connection.readyState
    const dbStatusMap: { [key: number]: string } = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }
    const dbStatus = dbStatusMap[dbState] || 'unknown'
    
    // System information
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: dbStatus,
        connected: dbState === 1
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      system: {
        platform: process.platform,
        nodeVersion: process.version,
        pid: process.pid
      }
    }
    
    return NextResponse.json(healthData, { status: 200 })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    )
  }
}

// HEAD method for simple health checks
export async function HEAD() {
  try {
    await connectDB()
    return new NextResponse(null, { status: 200 })
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}
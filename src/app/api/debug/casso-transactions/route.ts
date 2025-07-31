import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import CassoTransaction from '@/models/CassoTransaction'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const description = searchParams.get('description')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    let query: any = {}
    
    if (description) {
      query.description = { $regex: description, $options: 'i' }
    }
    
    const transactions = await CassoTransaction.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('userId', 'username email')
      .populate('paymentId', 'orderCode amount status')
    
    const totalTransactions = await CassoTransaction.countDocuments(query)
    
    return NextResponse.json({
      success: true,
      data: {
        description: description || 'all',
        totalTransactions,
        transactions: transactions.map(t => ({
          cassoId: t.cassoId,
          tid: t.tid,
          description: t.description,
          amount: t.amount,
          when: t.when,
          processed: t.processed,
          error: t.error,
          user: t.userId ? {
            username: (t.userId as any).username,
            email: (t.userId as any).email
          } : null,
          payment: t.paymentId ? {
            orderCode: (t.paymentId as any).orderCode,
            amount: (t.paymentId as any).amount,
            status: (t.paymentId as any).status
          } : null,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt
        }))
      }
    })
    
  } catch (error) {
    console.error('Debug Casso transactions error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch Casso transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
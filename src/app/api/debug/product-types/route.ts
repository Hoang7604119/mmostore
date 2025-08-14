import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import ProductType from '@/models/ProductType'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const productTypes = await ProductType.find({})
      .select('name displayName image blobUrl imageBase64')
      .lean()
    
    return NextResponse.json({ productTypes }, { status: 200 })
  } catch (error) {
    console.error('Debug product types error:', error)
    return NextResponse.json(
      { error: 'Debug error' },
      { status: 500 }
    )
  }
}
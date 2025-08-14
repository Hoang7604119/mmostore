import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Product from '@/models/Product'

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Aggregate to count products by type (only approved and not sold_out)
    const productCounts = await Product.aggregate([
      {
        $match: {
          status: { $in: ['approved'] } // Only approved products
        }
      },
      {
        $lookup: {
          from: 'accountitems',
          localField: '_id',
          foreignField: 'productId',
          as: 'accountItems'
        }
      },
      {
        $addFields: {
          availableCount: {
            $size: {
              $filter: {
                input: '$accountItems',
                cond: { $eq: ['$$this.status', 'available'] }
              }
            }
          }
        }
      },
      {
        $match: {
          availableCount: { $gt: 0 } // Only products with available items
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ])
    
    // Convert to object for easier lookup
    const countsMap = productCounts.reduce((acc, item) => {
      acc[item._id] = item.count
      return acc
    }, {} as Record<string, number>)
    
    return NextResponse.json({ productCounts: countsMap })
  } catch (error) {
    console.error('Error fetching product counts:', error)
    return NextResponse.json(
      { error: 'Lỗi khi lấy số lượng sản phẩm' },
      { status: 500 }
    )
  }
}
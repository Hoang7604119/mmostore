import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Message from '@/models/Message'
import { verifyToken } from '@/lib/utils'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.userId

    // Force recalculate unread count from database
    const totalUnread = await Message.countDocuments({
      receiverId: new mongoose.Types.ObjectId(userId),
      isRead: false
    })

    // Get fresh conversations data
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          messages: { $push: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', new mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      },
      {
        $limit: 20
      }
    ])

    return NextResponse.json({
      success: true,
      totalUnread,
      conversationsCount: conversations.length,
      message: 'Data refreshed successfully'
    })
  } catch (error) {
    console.error('Refresh API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
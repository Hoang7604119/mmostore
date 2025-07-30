import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Message from '@/models/Message'
import User from '@/models/User'
import { verifyToken } from '@/lib/utils'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

// GET - Lấy danh sách cuộc trò chuyện của user
export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Verify token
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 403 }
      )
    }

    const userId = decoded.userId
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Aggregate to get conversations with last message and unread count
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
        $skip: skip
      },
      {
        $limit: limit
      }
    ])

    // Populate user information for each conversation
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = conv.lastMessage
        
        // Determine the other user (not the current user)
        const otherUserId = lastMessage.senderId.toString() === userId 
          ? lastMessage.receiverId 
          : lastMessage.senderId
        
        const otherUser = await User.findById(otherUserId)
          .select('_id username email')
          .lean()
        
        return {
          conversationId: conv._id,
          otherUser: otherUser || {
            _id: otherUserId,
            username: 'Người dùng không tồn tại',
            email: ''
          },
          lastMessage: {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            isRead: lastMessage.isRead,
            senderId: lastMessage.senderId.toString(),
            messageType: lastMessage.messageType
          },
          unreadCount: conv.unreadCount
        }
      })
    )

    // Calculate total unread messages from conversations
    const totalUnread = populatedConversations.reduce((total, conv) => total + conv.unreadCount, 0)



    // Get total conversations count
    const totalConversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $group: {
          _id: '$conversationId'
        }
      },
      {
        $count: 'total'
      }
    ])

    const total = totalConversations[0]?.total || 0

    return NextResponse.json({
      conversations: populatedConversations,
      totalUnread,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
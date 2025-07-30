import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Message from '@/models/Message'
import User from '@/models/User'
import { verifyToken } from '@/lib/utils'
import mongoose from 'mongoose'

export const dynamic = 'force-dynamic'

// Import Socket.io instance
declare global {
  var io: any
}

// POST - Gửi tin nhắn mới (có thể tạo cuộc trò chuyện mới)
export async function POST(request: NextRequest) {
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
    const { content, receiverId, messageType = 'text', attachments, metadata } = await request.json()

    // Validation
    if (!content || !receiverId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Tin nhắn quá dài (tối đa 2000 ký tự)' },
        { status: 400 }
      )
    }

    if (userId === receiverId) {
      return NextResponse.json(
        { error: 'Không thể gửi tin nhắn cho chính mình' },
        { status: 400 }
      )
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId)
    if (!receiver) {
      return NextResponse.json(
        { error: 'Người nhận không tồn tại' },
        { status: 404 }
      )
    }

    // Generate conversation ID
    const conversationId = Message.generateConversationId(userId, receiverId)

    // Create new message
    const newMessage = await Message.create({
      senderId: new mongoose.Types.ObjectId(userId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      content,
      messageType,
      conversationId,
      attachments: attachments || [],
      metadata: metadata || {},
      isRead: false
    })

    // Populate sender and receiver info
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', '_id username email')
      .populate('receiverId', '_id username email')
      .lean()

    // Emit real-time message if Socket.io is available
    if (global.io) {
      // Emit to conversation room for chat interface
      global.io.to(`conversation-${conversationId}`).emit('message-received', populatedMessage)
      
      // Emit to receiver's user room for MessageIcon realtime updates
      global.io.to(`user-${receiverId}`).emit('message-received', populatedMessage)
    }

    return NextResponse.json({
      message: populatedMessage,
      conversationId
    }, { status: 201 })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
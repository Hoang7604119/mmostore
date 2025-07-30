import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Message from '@/models/Message'
import User from '@/models/User'
import { verifyToken } from '@/lib/utils'
import mongoose from 'mongoose'
import { notifyNewMessage, markMessageNotificationsAsRead } from '@/utils/notificationHelpers'

export const dynamic = 'force-dynamic'

// Import Socket.io instance
declare global {
  var io: any
}

// GET - Lấy tin nhắn trong cuộc trò chuyện
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
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
    const { conversationId } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Verify user is part of this conversation
    const conversationCheck = await Message.findOne({
      conversationId,
      $or: [
        { senderId: new mongoose.Types.ObjectId(userId) },
        { receiverId: new mongoose.Types.ObjectId(userId) }
      ]
    })

    if (!conversationCheck) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập cuộc trò chuyện này' },
        { status: 403 }
      )
    }

    // Get messages in conversation
    const messages = await Message.find({ conversationId })
      .populate('senderId', '_id username email')
      .populate('receiverId', '_id username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Mark messages as read if current user is receiver
    const markAsReadResult = await Message.updateMany(
      {
        conversationId,
        receiverId: new mongoose.Types.ObjectId(userId),
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    )

    // Emit real-time update if messages were marked as read and Socket.io is available
    if (markAsReadResult.modifiedCount > 0 && global.io && messages.length > 0) {
      // Get the other user ID from any message in the conversation
      const firstMessage = messages[0]
      const otherUserId = firstMessage.senderId._id.toString() === userId 
        ? firstMessage.receiverId._id.toString() 
        : firstMessage.senderId._id.toString()
      
      // Emit to both users to update their conversation lists
      global.io.to(`user-${userId}`).emit('message-read-update', {
        conversationId,
        readByUserId: userId,
        modifiedCount: markAsReadResult.modifiedCount
      })
      
      global.io.to(`user-${otherUserId}`).emit('message-read-update', {
        conversationId,
        readByUserId: userId,
        modifiedCount: markAsReadResult.modifiedCount
      })
    }

    // Mark message notifications as read when user views conversation
    await markMessageNotificationsAsRead(userId, conversationId)

    // Get total messages count
    const totalMessages = await Message.countDocuments({ conversationId })

    // Get other user info
    const otherUserMessage = messages.find(msg => 
      msg.senderId._id.toString() !== userId && msg.receiverId._id.toString() !== userId
        ? false
        : msg.senderId._id.toString() !== userId 
          ? msg.senderId 
          : msg.receiverId
    )
    
    let otherUser = null
    if (otherUserMessage) {
      const otherUserId = otherUserMessage.senderId._id.toString() === userId 
        ? otherUserMessage.receiverId._id 
        : otherUserMessage.senderId._id
      
      otherUser = await User.findById(otherUserId)
        .select('_id username email')
        .lean()
    }

    // Mark message notifications as read when user views conversation
    await markMessageNotificationsAsRead(userId, conversationId)

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to show oldest first
      otherUser,
      pagination: {
        page,
        limit,
        total: totalMessages,
        totalPages: Math.ceil(totalMessages / limit)
      }
    }, { status: 200 })

  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}

// POST - Gửi tin nhắn mới
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
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
    const { conversationId } = params
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

    // Verify receiver exists
    const receiver = await User.findById(receiverId)
    if (!receiver) {
      return NextResponse.json(
        { error: 'Người nhận không tồn tại' },
        { status: 404 }
      )
    }

    // Generate conversation ID if not provided or verify existing one
    const expectedConversationId = Message.generateConversationId(userId, receiverId)
    if (conversationId !== expectedConversationId) {
      return NextResponse.json(
        { error: 'ID cuộc trò chuyện không hợp lệ' },
        { status: 400 }
      )
    }

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

    // Get sender info for notification
    const sender = await User.findById(userId).select('username').lean()

    // Emit real-time message if Socket.io is available
    if (global.io) {
      // Emit to conversation room for chat interface
      global.io.to(`conversation-${conversationId}`).emit('message-received', populatedMessage)
      
      // Emit to receiver's user room for MessageIcon realtime updates
      global.io.to(`user-${receiverId}`).emit('message-received', populatedMessage)
    }

    return NextResponse.json({
      message: populatedMessage
    }, { status: 201 })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Lỗi server, vui lòng thử lại' },
      { status: 500 }
    )
  }
}
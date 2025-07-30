import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage extends Document {
  _id: string
  senderId: mongoose.Types.ObjectId
  receiverId: mongoose.Types.ObjectId
  content: string
  messageType: 'text' | 'image' | 'file' | 'system'
  isRead: boolean
  conversationId: string
  attachments?: {
    type: 'image' | 'file'
    url: string
    name: string
    size?: number
  }[]
  metadata?: {
    orderId?: string
    productId?: string
    [key: string]: any
  }
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    size: {
      type: Number
    }
  }],
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
})

// Indexes for better performance
MessageSchema.index({ conversationId: 1, createdAt: -1 })
MessageSchema.index({ senderId: 1, receiverId: 1 })
MessageSchema.index({ receiverId: 1, isRead: 1 })

// Generate conversation ID from two user IDs
MessageSchema.statics.generateConversationId = function(userId1: string, userId2: string): string {
  const sortedIds = [userId1, userId2].sort()
  return `${sortedIds[0]}_${sortedIds[1]}`
}

// Interface for static methods
interface IMessageModel extends mongoose.Model<IMessage> {
  generateConversationId(userId1: string, userId2: string): string
}

const Message = (mongoose.models.Message as unknown as IMessageModel) || mongoose.model<IMessage, IMessageModel>('Message', MessageSchema)

export default Message
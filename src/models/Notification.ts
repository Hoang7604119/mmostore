import mongoose from 'mongoose'

interface INotification {
  _id?: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'product' | 'order' | 'account' | 'system' | 'payment'
  isRead: boolean
  actionUrl?: string
  actionText?: string
  metadata?: {
    productId?: string
    orderId?: string
    amount?: number
    [key: string]: any
  }
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new mongoose.Schema<INotification>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  category: {
    type: String,
    enum: ['product', 'order', 'account', 'system', 'payment'],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  actionUrl: {
    type: String,
    required: false
  },
  actionText: {
    type: String,
    required: false
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })
NotificationSchema.index({ userId: 1, category: 1, createdAt: -1 })

export type { INotification }
export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)
import mongoose, { Document, Schema } from 'mongoose'

export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded'

export interface IOrder extends Document {
  _id: string
  orderNumber: string // Số đơn hàng duy nhất (ví dụ: ORD-20240125-001)
  buyerId: mongoose.Types.ObjectId
  sellerId: mongoose.Types.ObjectId
  productId: mongoose.Types.ObjectId
  accountItems: mongoose.Types.ObjectId[] // Danh sách tài khoản đã mua
  quantity: number
  pricePerUnit: number
  totalAmount: number
  status: OrderStatus
  paymentMethod: 'credit' // Hiện tại chỉ hỗ trợ credit
  notes?: string // Ghi chú từ buyer
  sellerNotes?: string // Ghi chú từ seller
  completedAt?: Date
  cancelledAt?: Date
  cancelReason?: string
  refundAmount?: number
  refundedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface IOrderModel extends mongoose.Model<IOrder> {
  generateOrderNumber(): Promise<string>
}

const OrderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  buyerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  accountItems: [{
    type: Schema.Types.ObjectId,
    ref: 'AccountItem'
  }],
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit'],
    default: 'credit'
  },
  notes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  sellerNotes: {
    type: String,
    maxlength: 500,
    trim: true
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancelReason: {
    type: String,
    maxlength: 200,
    trim: true
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  refundedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Index for faster queries
OrderSchema.index({ buyerId: 1, createdAt: -1 })
OrderSchema.index({ sellerId: 1, createdAt: -1 })
OrderSchema.index({ status: 1, createdAt: -1 })

// Static method to generate order number
OrderSchema.statics.generateOrderNumber = async function() {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  
  // Find the last order of today
  const lastOrder = await this.findOne({
    orderNumber: { $regex: `^ORD-${dateStr}-` }
  }).sort({ orderNumber: -1 })
  
  let sequence = 1
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2])
    sequence = lastSequence + 1
  }
  
  return `ORD-${dateStr}-${sequence.toString().padStart(3, '0')}`
}

// Pre-save middleware to generate order number
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    this.orderNumber = await (this.constructor as any).generateOrderNumber()
  }
  next()
})

// Prevent re-compilation during development
const Order = (mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)) as unknown as IOrderModel

export default Order
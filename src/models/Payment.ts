import mongoose from 'mongoose'

interface IPayment {
  userId: mongoose.Types.ObjectId
  orderCode: number
  amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'failed'
  paymentMethod: 'payos' | 'bank' | 'ewallet'
  description: string
  paymentUrl?: string
  qrCode?: string
  transactionId?: string
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new mongoose.Schema<IPayment>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderCode: {
    type: Number,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 10000,
    max: 50000000
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['payos', 'bank', 'ewallet'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  paymentUrl: {
    type: String
  },
  qrCode: {
    type: String
  },
  transactionId: {
    type: String
  }
}, {
  timestamps: true
})

// Index for faster queries
PaymentSchema.index({ userId: 1, createdAt: -1 })
PaymentSchema.index({ orderCode: 1 })
PaymentSchema.index({ status: 1 })

const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema)

export default Payment
export type { IPayment }
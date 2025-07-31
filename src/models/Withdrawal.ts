import mongoose from 'mongoose'

interface IWithdrawal {
  userId: mongoose.Types.ObjectId
  amount: number
  bankAccount: {
    accountNumber: string
    accountName: string
    bankName: string
  }
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  adminNote?: string
  processedAt?: Date
  processedBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const WithdrawalSchema = new mongoose.Schema<IWithdrawal>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 50000, // Minimum withdrawal 50,000 VND
    max: 10000000 // Maximum withdrawal 10,000,000 VND
  },
  bankAccount: {
    accountNumber: {
      type: String,
      required: true
    },
    accountName: {
      type: String,
      required: true
    },
    bankName: {
      type: String,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected'],
    default: 'pending'
  },
  adminNote: {
    type: String
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
WithdrawalSchema.index({ userId: 1, createdAt: -1 })
WithdrawalSchema.index({ status: 1 })
WithdrawalSchema.index({ createdAt: -1 })

const Withdrawal = mongoose.models.Withdrawal || mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema)

export default Withdrawal
export type { IWithdrawal }
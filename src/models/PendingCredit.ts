import mongoose, { Schema, Document } from 'mongoose'
import { PENDING_CREDIT_STATUS, CREDIT_HOLD_REASONS } from '@/constants/credit'

export interface IPendingCredit extends Document {
  userId: mongoose.Types.ObjectId
  amount: number
  reason: string
  status: string
  orderId?: mongoose.Types.ObjectId // ID đơn hàng liên quan (nếu có)
  releaseDate: Date // Ngày dự kiến giải phóng
  actualReleaseDate?: Date // Ngày thực tế giải phóng
  note?: string
  createdAt: Date
  updatedAt: Date
}

const PendingCreditSchema = new Schema<IPendingCredit>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    enum: Object.values(CREDIT_HOLD_REASONS),
    default: CREDIT_HOLD_REASONS.SALE_COMMISSION
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(PENDING_CREDIT_STATUS),
    default: PENDING_CREDIT_STATUS.PENDING
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: false
  },
  releaseDate: {
    type: Date,
    required: true,
    index: true
  },
  actualReleaseDate: {
    type: Date,
    required: false
  },
  note: {
    type: String,
    required: false,
    maxlength: 500
  }
}, {
  timestamps: true
})

// Index để tối ưu query
PendingCreditSchema.index({ userId: 1, status: 1 })
PendingCreditSchema.index({ releaseDate: 1, status: 1 })
PendingCreditSchema.index({ createdAt: -1 })

// Virtual để tính toán thời gian còn lại
PendingCreditSchema.virtual('remainingTime').get(function() {
  if (this.status !== PENDING_CREDIT_STATUS.PENDING) return 0
  const now = new Date().getTime()
  const releaseTime = this.releaseDate.getTime()
  return Math.max(0, releaseTime - now)
})

// Virtual để kiểm tra có thể giải phóng không
PendingCreditSchema.virtual('canRelease').get(function() {
  if (this.status !== PENDING_CREDIT_STATUS.PENDING) return false
  const now = new Date().getTime()
  const releaseTime = this.releaseDate.getTime()
  return releaseTime <= now
})

// Method để giải phóng credit
PendingCreditSchema.methods.release = function() {
  this.status = PENDING_CREDIT_STATUS.RELEASED
  this.actualReleaseDate = new Date()
  return this.save()
}

// Method để hủy credit
PendingCreditSchema.methods.cancel = function(note?: string) {
  this.status = PENDING_CREDIT_STATUS.CANCELLED
  this.actualReleaseDate = new Date()
  if (note) this.note = note
  return this.save()
}

// Static method để tìm credit có thể giải phóng
PendingCreditSchema.statics.findReleasableCredits = function() {
  return this.find({
    status: PENDING_CREDIT_STATUS.PENDING,
    releaseDate: { $lte: new Date() }
  })
}

// Static method để tính tổng credit đang bị giam giữ của user
PendingCreditSchema.statics.getTotalPendingByUser = function(userId: string) {
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        status: PENDING_CREDIT_STATUS.PENDING
      }
    },
    {
      $group: {
        _id: null,
        totalPending: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ])
}

const PendingCredit = mongoose.models.PendingCredit || mongoose.model<IPendingCredit>('PendingCredit', PendingCreditSchema)

export default PendingCredit
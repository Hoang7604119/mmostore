import mongoose, { Document, Schema } from 'mongoose'

export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'rejected'
export type ReportType = 'fake_account' | 'wrong_info' | 'not_working' | 'scam' | 'other'

export interface IReport extends Document {
  _id: string
  reporterId: mongoose.Types.ObjectId // người báo cáo (buyer)
  productId: mongoose.Types.ObjectId // sản phẩm bị báo cáo
  accountItemId: mongoose.Types.ObjectId // tài khoản cụ thể bị báo cáo
  sellerId: mongoose.Types.ObjectId // người bán
  reportType: ReportType
  title: string
  description: string
  evidence?: string[] // ảnh chụp màn hình, link, v.v.
  status: ReportStatus
  adminNote?: string // ghi chú từ admin/manager
  refundAmount?: number // số tiền hoàn lại
  refundProcessed: boolean
  sellerPenalty?: {
    type: 'warning' | 'credit_deduction' | 'temporary_ban' | 'permanent_ban'
    amount?: number // số credit bị trừ
    duration?: number // thời gian ban (ngày)
    reason: string
  }
  resolvedAt?: Date
  resolvedBy?: mongoose.Types.ObjectId // admin/manager xử lý
  createdAt: Date
  updatedAt: Date
}

const ReportSchema = new Schema<IReport>({
  reporterId: {
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
  accountItemId: {
    type: Schema.Types.ObjectId,
    ref: 'AccountItem',
    required: true,
    index: true
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reportType: {
    type: String,
    enum: ['fake_account', 'wrong_info', 'not_working', 'scam', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  evidence: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'rejected'],
    default: 'pending',
    index: true
  },
  adminNote: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  refundProcessed: {
    type: Boolean,
    default: false
  },
  sellerPenalty: {
    type: {
      type: String,
      enum: ['warning', 'credit_deduction', 'temporary_ban', 'permanent_ban']
    },
    amount: {
      type: Number,
      min: 0
    },
    duration: {
      type: Number,
      min: 1
    },
    reason: {
      type: String,
      trim: true,
      validate: {
        validator: function(this: IReport, value: string) {
          // If sellerPenalty.type is set, then reason is required
          if (this.sellerPenalty?.type && !value) {
            return false
          }
          return true
        },
        message: 'Lý do phạt là bắt buộc khi thiết lập hình phạt cho người bán'
      }
    }
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
ReportSchema.index({ reporterId: 1, status: 1, createdAt: -1 })
ReportSchema.index({ sellerId: 1, status: 1, createdAt: -1 })
ReportSchema.index({ status: 1, createdAt: -1 })

// Prevent duplicate reports for same account item by same reporter
ReportSchema.index({ reporterId: 1, accountItemId: 1 }, { unique: true })

const Report = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema)

export default Report
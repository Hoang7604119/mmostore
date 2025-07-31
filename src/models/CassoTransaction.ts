import mongoose, { Document, Schema } from 'mongoose'

export interface ICassoTransaction extends Document {
  _id: string
  cassoId: string // ID từ Casso
  tid?: string // Transaction ID từ ngân hàng
  description: string // Nội dung chuyển khoản
  amount: number // Số tiền
  cusumBalance: number // Số dư tích lũy
  when: Date // Thời gian giao dịch
  bankSubAccId?: string // ID tài khoản phụ ngân hàng
  subAccId?: string // ID tài khoản phụ
  processed: boolean // Đã xử lý chưa
  userId?: mongoose.Types.ObjectId // ID người dùng (nếu tìm thấy)
  paymentId?: mongoose.Types.ObjectId // ID payment record (nếu tạo thành công)
  error?: string // Lỗi nếu có
  createdAt: Date
  updatedAt: Date
}

const CassoTransactionSchema = new Schema<ICassoTransaction>({
  cassoId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tid: {
    type: String,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  cusumBalance: {
    type: Number,
    required: true
  },
  when: {
    type: Date,
    required: true,
    index: true
  },
  bankSubAccId: {
    type: String
  },
  subAccId: {
    type: String
  },
  processed: {
    type: Boolean,
    default: false,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentId: {
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  },
  error: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
})

// Indexes for efficient queries
CassoTransactionSchema.index({ processed: 1, createdAt: -1 })
CassoTransactionSchema.index({ userId: 1, createdAt: -1 })
CassoTransactionSchema.index({ when: -1 })

// Prevent re-compilation during development
const CassoTransaction = mongoose.models.CassoTransaction || mongoose.model<ICassoTransaction>('CassoTransaction', CassoTransactionSchema)

export default CassoTransaction
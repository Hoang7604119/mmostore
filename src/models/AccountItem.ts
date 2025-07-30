import mongoose, { Schema, Document } from 'mongoose'

export interface IAccountItem extends Document {
  productId: mongoose.Types.ObjectId
  username: string
  password: string
  email?: string
  additionalInfo?: string
  // New fields for flexible account format
  accountData?: string // Raw account data (e.g., "mail|pass|2fa|recovery")
  fieldNames?: string[] // Field names (e.g., ["email", "password", "2fa", "recovery"])
  status: 'available' | 'sold' | 'reserved'
  soldTo?: mongoose.Types.ObjectId // buyerId when sold
  soldAt?: Date
  createdAt: Date
  updatedAt: Date
}

const AccountItemSchema = new Schema<IAccountItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  username: {
    type: String,
    required: false,
    trim: true
  },
  password: {
    type: String,
    required: false
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  additionalInfo: {
    type: String,
    trim: true
  },
  // New fields for flexible account format
  accountData: {
    type: String,
    trim: true
  },
  fieldNames: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['available', 'sold', 'reserved'],
    default: 'available',
    index: true
  },
  soldTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  soldAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Compound index for efficient queries
AccountItemSchema.index({ productId: 1, status: 1 })
// Remove unique constraint on username/email for flexible format
// AccountItemSchema.index({ username: 1, email: 1 }, { unique: true, sparse: true })
AccountItemSchema.index({ accountData: 1 }, { unique: true, sparse: true })

const AccountItem = mongoose.models.AccountItem || mongoose.model<IAccountItem>('AccountItem', AccountItemSchema)

export default AccountItem
import mongoose, { Document, Schema } from 'mongoose'

export type UserRole = 'admin' | 'manager' | 'seller' | 'buyer'

export interface IUser extends Document {
  _id: string
  username: string
  email: string
  password: string
  role: UserRole
  isActive: boolean
  credit: number
  sellerRequest?: {
    status: 'pending' | 'approved' | 'rejected'
    requestedAt: Date
    reviewedAt?: Date
    reviewedBy?: string
    note?: string
    personalInfo?: {
      fullName: string
      phoneNumber: string
      address: string
      idNumber: string
    }
    bankAccount?: {
      bankName: string
      accountNumber: string
      accountHolder: string
      branch?: string
    }
  }
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'seller', 'buyer'],
    default: 'buyer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  credit: {
    type: Number,
    default: 0,
    min: 0
  },
  sellerRequest: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected']
    },
    requestedAt: {
      type: Date
    },
    reviewedAt: {
      type: Date
    },
    reviewedBy: {
      type: String
    },
    note: {
      type: String
    },
    personalInfo: {
      fullName: {
        type: String
      },
      phoneNumber: {
        type: String
      },
      address: {
        type: String
      },
      idNumber: {
        type: String
      }
    },
    bankAccount: {
      bankName: {
        type: String
      },
      accountNumber: {
        type: String
      },
      accountHolder: {
        type: String
      },
      branch: {
        type: String
      }
    }
  }
}, {
  timestamps: true
})

// Prevent re-compilation during development
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User
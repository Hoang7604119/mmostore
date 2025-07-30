import mongoose from 'mongoose'

interface IEmailVerification {
  email: string
  code: string
  expiresAt: Date
  attempts: number
  isUsed: boolean
  createdAt: Date
}

const emailVerificationSchema = new mongoose.Schema<IEmailVerification>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    length: 6
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Maximum 5 attempts
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

// Index for automatic cleanup of expired documents
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Index for faster email lookups
emailVerificationSchema.index({ email: 1 })

// Static method to clean up old verification codes
emailVerificationSchema.statics.cleanupExpired = async function() {
  return this.deleteMany({ expiresAt: { $lt: new Date() } })
}

// Instance method to check if code is expired
emailVerificationSchema.methods.isExpired = function() {
  return this.expiresAt < new Date()
}

// Instance method to check if max attempts reached
emailVerificationSchema.methods.hasMaxAttemptsReached = function() {
  return this.attempts >= 5
}

const EmailVerification = mongoose.models.EmailVerification || mongoose.model<IEmailVerification>('EmailVerification', emailVerificationSchema)

export default EmailVerification
export type { IEmailVerification }

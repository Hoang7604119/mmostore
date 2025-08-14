import mongoose, { Document, Schema } from 'mongoose'

export interface IProductType extends Document {
  _id: string
  name: string
  displayName: string
  icon: string
  color: string
  image?: string // Legacy field for file system images
  blobUrl?: string // Vercel Blob Storage URL
  description?: string
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

const ProductTypeSchema = new Schema<IProductType>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 50
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  icon: {
    type: String,
    required: false,
    trim: true,
    default: function() {
      return this.displayName ? this.displayName.charAt(0).toUpperCase() : 'N'
    }
  },
  color: {
    type: String,
    required: true,
    trim: true,
    match: /^#[0-9A-F]{6}$/i // Hex color validation
  },
  image: {
    type: String,
    trim: true
  },
  blobUrl: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Index for sorting
ProductTypeSchema.index({ order: 1, displayName: 1 })

// Prevent re-compilation during development
const ProductType = mongoose.models.ProductType || mongoose.model<IProductType>('ProductType', ProductTypeSchema)

export default ProductType
import mongoose, { Document, Schema } from 'mongoose'

export interface IReview extends Document {
  _id: string
  productId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId // Changed from buyerId to userId to allow all roles
  sellerId: mongoose.Types.ObjectId
  rating: number // 1-5 stars
  comment: string
  images?: string[] // Optional review images
  isVerifiedPurchase: boolean
  sellerReply?: {
    comment: string
    repliedAt: Date
  }
  isHidden: boolean // Admin can hide inappropriate reviews
  helpfulCount: number // Number of users who found this review helpful
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  userId: {
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

  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  images: [{
    type: String,
    trim: true
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  sellerReply: {
    comment: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    repliedAt: {
      type: Date
    }
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  helpfulCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
ReviewSchema.index({ productId: 1, createdAt: -1 })
ReviewSchema.index({ userId: 1, createdAt: -1 })
ReviewSchema.index({ sellerId: 1, createdAt: -1 })
ReviewSchema.index({ rating: 1, createdAt: -1 })

// Unique constraint: one review per product per user
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true })

// Pre-save middleware to update product rating
ReviewSchema.post('save', async function() {
  try {
    const Product = mongoose.model('Product')
    
    // Calculate new average rating for the product
    const reviews = await mongoose.model('Review').find({ 
      productId: this.productId, 
      isHidden: false 
    })
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0
    
    await Product.findByIdAndUpdate(this.productId, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      reviewCount: reviews.length
    })
    
    console.log(`Updated product ${this.productId} rating to ${Math.round(averageRating * 10) / 10} with ${reviews.length} reviews`)
  } catch (error) {
    console.error('Error updating product rating after review save:', error)
  }
})

// Pre-remove middleware to update product rating
ReviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      const Product = mongoose.model('Product')
      
      const reviews = await mongoose.model('Review').find({ 
        productId: doc.productId, 
        isHidden: false 
      })
      
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0
      
      await Product.findByIdAndUpdate(doc.productId, {
        rating: Math.round(averageRating * 10) / 10,
        reviewCount: reviews.length
      })
      
      console.log(`Updated product ${doc.productId} rating to ${Math.round(averageRating * 10) / 10} with ${reviews.length} reviews after deletion`)
    } catch (error) {
      console.error('Error updating product rating after review deletion:', error)
    }
  }
})

const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema)

export default Review
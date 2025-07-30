import mongoose, { Document, Schema } from 'mongoose'
import ProductType from './ProductType'

export type ProductTypeString = string
export type ProductStatus = 'pending' | 'approved' | 'sold_out' | 'rejected'

export interface IProduct extends Document {
  _id: string
  type: ProductTypeString
  title: string
  description?: string
  quantity: number
  pricePerUnit: number
  sellerId: mongoose.Types.ObjectId
  status: ProductStatus
  soldCount: number
  category: string
  images?: string[]
  rating: number
  reviewCount: number
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>({
  type: {
    type: String,
    required: true,
    index: true,
    validate: {
      validator: async function(value: string) {
        // Check if the type exists in ProductType collection and is active
        const productType = await ProductType.findOne({ 
          name: value.toLowerCase(), 
          isActive: true 
        })
        return !!productType
      },
      message: (props: any) => `\`${props.value}\` is not a valid product type. Please add it in admin dashboard first.`
    }
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'sold_out', 'rejected'],
    default: 'pending',
    index: true
  },
  soldCount: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
})

// Prevent re-compilation during development
const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)

export default Product
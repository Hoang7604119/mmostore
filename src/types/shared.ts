// Shared types for the marketplace application

export interface Product {
  _id: string
  title: string
  description: string
  price: number
  pricePerUnit?: number // Legacy field for backward compatibility
  quantity: number
  soldCount?: number
  productType: string
  type?: string // Legacy field for backward compatibility
  category: string
  seller: {
    _id: string
    username: string
    email: string
    rating?: number
  }
  status: 'available' | 'pending' | 'approved' | 'rejected' | 'sold_out'
  createdAt: string
  updatedAt?: string
  availableCount?: number
  totalAccountItems?: number
}

export interface User {
  _id: string
  username: string
  email: string
  role: 'admin' | 'manager' | 'seller' | 'buyer'
  credit: number
  isActive: boolean
}

export interface ProductType {
  _id: string
  name: string
  displayName?: string
  description?: string
  icon?: string
  color: string
  image?: string
  imageUrl?: string
  imageBase64?: string
  finalImageUrl?: string
  order: number
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalProducts: number
  limit?: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ProductsResponse {
  products: Product[]
  pagination: PaginationInfo
}

export interface UseProductsParams {
  productType?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  page?: number
  limit?: number
}
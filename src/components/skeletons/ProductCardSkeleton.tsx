import React from 'react'
import { cn } from '@/lib/utils'

interface ProductCardSkeletonProps {
  className?: string
}

const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ className }) => {
  return (
    <div className={cn(
      'bg-white rounded-2xl shadow-lg p-6 animate-pulse',
      className
    )}>
      {/* Product type icon and name */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-xl" />
        <div className="h-4 bg-gray-200 rounded w-20" />
      </div>
      
      {/* Product title */}
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
      
      {/* Product description */}
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
      
      {/* Price */}
      <div className="h-8 bg-gray-200 rounded w-24 mb-4" />
      
      {/* Available count */}
      <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
      
      {/* Action buttons */}
      <div className="space-y-2">
        <div className="h-10 bg-gray-200 rounded" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

export default ProductCardSkeleton
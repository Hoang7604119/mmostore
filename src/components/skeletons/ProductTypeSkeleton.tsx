import React from 'react'
import { cn } from '@/lib/utils'

interface ProductTypeSkeletonProps {
  className?: string
}

const ProductTypeSkeleton: React.FC<ProductTypeSkeletonProps> = ({ className }) => {
  return (
    <div className={cn(
      'flex items-center space-x-3 p-3 bg-white rounded-xl shadow-sm animate-pulse',
      className
    )}>
      {/* Product type icon */}
      <div className="w-12 h-12 bg-gray-200 rounded-xl flex-shrink-0" />
      
      {/* Product type name */}
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-24" />
      </div>
      
      {/* Product count */}
      <div className="h-4 bg-gray-200 rounded w-12" />
    </div>
  )
}

export default ProductTypeSkeleton
import React from 'react'

interface ProductCardSkeletonProps {
  viewMode?: 'grid' | 'list'
}

export default function ProductCardSkeleton({ viewMode = 'grid' }: ProductCardSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
        <div className="flex gap-4">
          {/* Product Image Skeleton */}
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
          
          {/* Product Info Skeleton */}
          <div className="flex-1 space-y-2">
            {/* Status Badge */}
            <div className="w-16 h-5 bg-gray-200 rounded-full"></div>
            
            {/* Product Type */}
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
            
            {/* Title */}
            <div className="w-3/4 h-5 bg-gray-200 rounded"></div>
            
            {/* Description */}
            <div className="space-y-1">
              <div className="w-full h-3 bg-gray-200 rounded"></div>
              <div className="w-2/3 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
          
          {/* Price and Actions Skeleton */}
          <div className="flex flex-col justify-between items-end space-y-2">
            {/* Price */}
            <div className="w-20 h-6 bg-gray-200 rounded"></div>
            
            {/* Quantity Info */}
            <div className="w-16 h-4 bg-gray-200 rounded"></div>
            
            {/* Progress Bar */}
            <div className="w-24 h-2 bg-gray-200 rounded-full"></div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <div className="w-16 h-8 bg-gray-200 rounded"></div>
              <div className="w-16 h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid view skeleton
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse">
      {/* Status Badge */}
      <div className="w-16 h-5 bg-gray-200 rounded-full mb-3"></div>
      
      {/* Product Type */}
      <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
      
      {/* Title */}
      <div className="w-full h-5 bg-gray-200 rounded mb-2"></div>
      
      {/* Description */}
      <div className="space-y-1 mb-4">
        <div className="w-full h-3 bg-gray-200 rounded"></div>
        <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
        <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
      </div>
      
      {/* Price */}
      <div className="w-20 h-6 bg-gray-200 rounded mb-2"></div>
      
      {/* Quantity Info */}
      <div className="flex justify-between items-center mb-2">
        <div className="w-16 h-4 bg-gray-200 rounded"></div>
        <div className="w-12 h-4 bg-gray-200 rounded"></div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-4"></div>
      
      {/* Seller Info */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
        <div className="w-20 h-4 bg-gray-200 rounded"></div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        <div className="flex-1 h-8 bg-gray-200 rounded"></div>
        <div className="flex-1 h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

// Multiple skeletons component for loading states
interface ProductSkeletonsProps {
  count?: number
  viewMode?: 'grid' | 'list'
}

export function ProductSkeletons({ count = 6, viewMode = 'grid' }: ProductSkeletonsProps) {
  return (
    <div className={viewMode === 'grid' 
      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
      : 'space-y-4'
    }>
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} viewMode={viewMode} />
      ))}
    </div>
  )
}
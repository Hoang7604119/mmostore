import React from 'react'
import { cn } from '@/lib/utils'

interface SearchSkeletonProps {
  className?: string
}

const SearchSkeleton: React.FC<SearchSkeletonProps> = ({ className }) => {
  return (
    <div className={cn(
      'bg-white rounded-2xl shadow-lg p-6 animate-pulse',
      className
    )}>
      {/* Title */}
      <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
      
      {/* Description */}
      <div className="h-4 bg-gray-200 rounded w-64 mb-6" />
      
      {/* Search input and filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search input */}
        <div className="h-12 bg-gray-200 rounded-lg" />
        
        {/* Product type filter */}
        <div className="h-12 bg-gray-200 rounded-lg" />
        
        {/* Min price filter */}
        <div className="h-12 bg-gray-200 rounded-lg" />
        
        {/* Max price filter */}
        <div className="h-12 bg-gray-200 rounded-lg" />
      </div>
    </div>
  )
}

export default SearchSkeleton
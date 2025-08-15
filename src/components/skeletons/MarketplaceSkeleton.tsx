import React from 'react'
import { cn } from '@/lib/utils'
import SearchSkeleton from './SearchSkeleton'
import ProductTypeSkeleton from './ProductTypeSkeleton'
import ProductCardSkeleton from './ProductCardSkeleton'

interface MarketplaceSkeletonProps {
  className?: string
  showSearch?: boolean
  showProductTypes?: boolean
  productCount?: number
}

const MarketplaceSkeleton: React.FC<MarketplaceSkeletonProps> = ({
  className,
  showSearch = true,
  showProductTypes = true,
  productCount = 6,
}) => {
  return (
    <div className={cn('space-y-8', className)}>
      {/* Search section skeleton */}
      {showSearch && <SearchSkeleton />}
      
      {/* Product types section skeleton */}
      {showProductTypes && (
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <ProductTypeSkeleton key={index} />
            ))}
          </div>
        </div>
      )}
      
      {/* Products section skeleton */}
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: productCount }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
      
      {/* Load more button skeleton */}
      <div className="flex justify-center">
        <div className="h-12 bg-gray-200 rounded-lg w-32 animate-pulse" />
      </div>
    </div>
  )
}

// Preset skeletons for different loading states
export const InitialLoadingSkeleton: React.FC = () => (
  <MarketplaceSkeleton 
    showSearch={true}
    showProductTypes={true}
    productCount={6}
  />
)

export const ProductsOnlySkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <MarketplaceSkeleton 
    showSearch={false}
    showProductTypes={false}
    productCount={count}
  />
)

export const SearchResultsSkeleton: React.FC = () => (
  <MarketplaceSkeleton 
    showSearch={false}
    showProductTypes={false}
    productCount={4}
  />
)

export default MarketplaceSkeleton
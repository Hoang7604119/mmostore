import { useQuery } from '@tanstack/react-query'
import type { ProductType } from '@/types/shared'

// Types

interface ProductTypesResponse {
  productTypes: ProductType[]
}

// API function
const fetchProductTypes = async (): Promise<ProductTypesResponse> => {
  const response = await fetch('/api/product-types-with-images')
  
  if (!response.ok) {
    throw new Error(`Failed to fetch product types: ${response.statusText}`)
  }
  
  return response.json()
}

// Hook
export function useProductTypes() {
  const query = useQuery({
    queryKey: ['productTypes'],
    queryFn: fetchProductTypes,
    staleTime: 10 * 60 * 1000, // 10 minutes - product types change less frequently
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
  
  return {
    ...query,
    productTypes: query.data?.productTypes || [],
  }
// ProductType is now exported from @/types/shared
}
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSearchDebounce } from './useDebounce'
import type { Product, PaginationInfo, ProductsResponse, UseProductsParams } from '@/types/shared'

// API function
const fetchProducts = async (params: UseProductsParams): Promise<ProductsResponse> => {
  const searchParams = new URLSearchParams()
  
  if (params.productType) searchParams.append('type', params.productType)
  if (params.category) searchParams.append('category', params.category)
  if (params.minPrice !== undefined) searchParams.append('minPrice', params.minPrice.toString())
  if (params.maxPrice !== undefined) searchParams.append('maxPrice', params.maxPrice.toString())
  if (params.search) searchParams.append('search', params.search)
  if (params.page) searchParams.append('page', params.page.toString())
  if (params.limit) searchParams.append('limit', params.limit.toString())

  const response = await fetch(`/api/buyer/products?${searchParams.toString()}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`)
  }
  
  return response.json()
}

// Hook
export function useProducts(params: UseProductsParams = {}) {
  const queryClient = useQueryClient()
  
  // Debounce search term to avoid excessive API calls
  const { debouncedSearchTerm, isSearching } = useSearchDebounce(params.search || '', 300)
  
  // Create query key for caching
  const queryKey = [
    'products',
    {
      ...params,
      search: debouncedSearchTerm, // Use debounced search term
    }
  ]
  
  // Use React Query to fetch and cache data
  const query = useQuery({
    queryKey,
    queryFn: () => fetchProducts({
      ...params,
      search: debouncedSearchTerm,
    }),
    enabled: true, // Always enabled, but debounced search will control when it actually runs
    staleTime: 5 * 60 * 1000, // 5 minutes - products data is considered fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: keepPreviousData, // Keep previous data while fetching new data
  })
  
  // Prefetch next page when current page loads successfully
  useEffect(() => {
    if (query.data && query.data.pagination?.hasNextPage && !isSearching) {
      const nextPageParams = {
        ...params,
        search: debouncedSearchTerm,
        page: (params.page || 1) + 1,
      }
      
      const nextPageQueryKey = [
        'products',
        {
          ...nextPageParams,
        }
      ]
      
      // Prefetch next page if not already cached
      queryClient.prefetchQuery({
        queryKey: nextPageQueryKey,
        queryFn: () => fetchProducts(nextPageParams),
        staleTime: 5 * 60 * 1000,
      })
    }
  }, [query.data, params, debouncedSearchTerm, isSearching, queryClient])
  
  return {
    ...query,
    products: query.data?.products || [],
    pagination: query.data?.pagination || null,
    isSearching, // Indicates if user is typing (before debounce completes)
    isLoading: query.isLoading || isSearching, // Show loading during search typing
  }
}

// Types are now exported from @/types/shared
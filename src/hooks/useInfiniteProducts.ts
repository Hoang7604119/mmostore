import { useInfiniteQuery, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import { useSearchDebounce } from './useDebounce'
import type { Product, PaginationInfo, ProductsResponse, UseProductsParams } from '@/types/shared'

// API function for infinite query
const fetchProductsPage = async (params: UseProductsParams & { pageParam?: number }): Promise<ProductsResponse> => {
  const searchParams = new URLSearchParams()
  
  if (params.productType) searchParams.append('type', params.productType)
  if (params.category) searchParams.append('category', params.category)
  if (params.minPrice !== undefined) searchParams.append('minPrice', params.minPrice.toString())
  if (params.maxPrice !== undefined) searchParams.append('maxPrice', params.maxPrice.toString())
  if (params.search) searchParams.append('search', params.search)
  if (params.pageParam) searchParams.append('page', params.pageParam.toString())
  if (params.limit) searchParams.append('limit', params.limit.toString())

  const url = `/api/buyer/products?${searchParams.toString()}`
  
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`)
  }
  
  const data = await response.json()
  
  return data
}

// Infinite scroll hook
export function useInfiniteProducts(params: UseProductsParams = {}) {
  const queryClient = useQueryClient()
  
  // Debounce search term to avoid excessive API calls
  const { debouncedSearchTerm, isSearching } = useSearchDebounce(params.search || '', 300)
  
  // Create query key for caching with memoization
  const queryKey = React.useMemo(() => [
    'infinite-products',
    {
      productType: params.productType,
      category: params.category,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      limit: params.limit,
      search: debouncedSearchTerm, // Use debounced search term
    }
  ], [params.productType, params.category, params.minPrice, params.maxPrice, params.limit, debouncedSearchTerm])
  
  // Use React Query infinite query
  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 1 }) => {
      return fetchProductsPage({
        ...params,
        search: debouncedSearchTerm,
        pageParam,
      })
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage: ProductsResponse) => {
      const nextPage = lastPage.pagination?.hasNextPage ? (lastPage.pagination.currentPage || 1) + 1 : undefined
      return nextPage
    },
    getPreviousPageParam: (firstPage: ProductsResponse) => {
      if (firstPage.pagination?.currentPage && firstPage.pagination.currentPage > 1) {
        return firstPage.pagination.currentPage - 1
      }
      return undefined
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: keepPreviousData,
  })
  
  // Flatten all products from all pages with deduplication
  const allProducts = React.useMemo(() => {
    if (!query.data?.pages) return []
    
    const flatProducts = query.data.pages.flatMap((page: ProductsResponse) => page.products)
    
    // Remove duplicates based on product._id
    const uniqueProducts = flatProducts.filter((product, index, array) => 
      array.findIndex(p => p._id === product._id) === index
    )
    
    return uniqueProducts
  }, [query.data?.pages])
  
  // Get pagination info from the last page
  const lastPage = query.data?.pages[query.data.pages.length - 1] as ProductsResponse | undefined
  const pagination = lastPage?.pagination
  
  // Prefetch next page when approaching the end (disabled to prevent infinite loop)
  // useEffect(() => {
  //   if (query.hasNextPage && !query.isFetchingNextPage && !isSearching) {
  //     // Prefetch when we're close to the end (within last 10 items)
  //     const totalLoaded = allProducts.length
  //     const shouldPrefetch = totalLoaded > 0 && totalLoaded % (params.limit || 20) === 0
  //     
  //     if (shouldPrefetch) {
  //       query.fetchNextPage()
  //     }
  //   }
  // }, [allProducts.length, query.hasNextPage, query.isFetchingNextPage, isSearching, params.limit])
  
  // Reset query when search term changes significantly
  useEffect(() => {
    if (debouncedSearchTerm !== params.search) {
      queryClient.removeQueries({ queryKey })
    }
  }, [debouncedSearchTerm, params.search, queryClient])
  


  return {
    ...query,
    products: allProducts,
    pagination,
    isSearching,
    isLoading: query.isLoading || isSearching,
    // Additional infinite scroll specific properties
    allProducts,
    totalProducts: pagination?.totalPages ? pagination.totalPages * (params.limit || 20) : 0,
    loadedPages: query.data?.pages.length || 0,
    canLoadMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    loadMore: query.fetchNextPage,
    refresh: query.refetch,
    reset: () => {
      queryClient.removeQueries({ queryKey })
      query.refetch()
    }
  }
}

// Hook for traditional pagination (keeping the original useProducts)
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
    queryFn: () => fetchProductsPage({
      ...params,
      search: debouncedSearchTerm,
      pageParam: params.page || 1,
    }),
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    placeholderData: keepPreviousData,
  })
  
  // Prefetch next page when current page loads successfully
  useEffect(() => {
    if (query.data?.pagination?.hasNextPage && !isSearching) {
      const nextPageParams = {
        ...params,
        search: debouncedSearchTerm,
        pageParam: (params.page || 1) + 1,
      }
      
      const nextPageQueryKey = [
        'products',
        {
          ...params,
          search: debouncedSearchTerm,
          page: (params.page || 1) + 1,
        }
      ]
      
      // Prefetch next page if not already cached
      queryClient.prefetchQuery({
        queryKey: nextPageQueryKey,
        queryFn: () => fetchProductsPage(nextPageParams),
        staleTime: 5 * 60 * 1000,
      })
    }
  }, [query.data?.pagination, params, debouncedSearchTerm, isSearching, queryClient])
  
  return {
    ...query,
    products: query.data?.products || [],
    pagination: query.data?.pagination,
    isSearching,
    isLoading: query.isLoading || isSearching,
  }
}
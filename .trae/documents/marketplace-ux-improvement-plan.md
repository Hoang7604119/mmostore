# Kế hoạch cải thiện UX cho Marketplace

## Tổng quan

Dựa trên phân tích PROMPT\_IMPROVEMENT\_PLAN.md và code hiện tại trong marketplace/page.tsx, tài liệu này đưa ra kế hoạch chi tiết để cải thiện trải nghiệm người dùng, loại bỏ các vấn đề về race condition, mất đồng bộ dữ liệu và tối ưu performance.

## Phân tích vấn đề hiện tại

### 🔍 Các vấn đề đã phát hiện trong marketplace/page.tsx:

1. **Filter & Search không có debounce**

   * Mỗi lần thay đổi searchTerm, categoryFilter, priceRange đều gọi API ngay lập tức

   * Gây ra nhiều request không cần thiết khi user typing

   * Có thể xảy ra race condition khi response trả về không đúng thứ tự

2. **Không có client-side caching**

   * Mỗi lần filter/pagination đều fetch lại từ server

   * Không prefetch trang tiếp theo

   * Không cache product types và product counts

3. **Loading UX kém**

   * `setProducts([])` clear toàn bộ products khi loading

   * Không có skeleton loading cho từng product card

   * Loading che toàn bộ grid thay vì loading từng phần

4. **Không có realtime updates**

   * Không sync trạng thái sản phẩm realtime

   * Không đồng bộ giữa các tab/browser

   * Product counts không update realtime

5. **State management phức tạp**

   * Quá nhiều useEffect dependencies

   * Logic initialization phức tạp với urlProcessed, initialized

   * Có thể xảy ra infinite re-render

## Kế hoạch cải thiện theo MCP

### 🎯 MCP 1: Debounce & Filter Control

#### Vấn đề hiện tại:

```javascript
// Trong marketplace/page.tsx - lines 120-125
useEffect(() => {
  if (initialized) {
    setCurrentPage(1)
    fetchProducts(1)
  }
}, [selectedType, categoryFilter, priceRange, searchTerm, initialized])
```

#### Giải pháp:

1. **Implement debounce cho search**

   ```javascript
   const [searchTerm, setSearchTerm] = useState('')
   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

   useEffect(() => {
     const timer = setTimeout(() => {
       setDebouncedSearchTerm(searchTerm)
     }, 300)
     return () => clearTimeout(timer)
   }, [searchTerm])
   ```

2. **Prevent duplicate requests**

   ```javascript
   const [isFiltering, setIsFiltering] = useState(false)
   const lastRequestRef = useRef(null)

   const fetchProducts = useCallback(async (params) => {
     if (isFiltering) return // Prevent concurrent requests
     
     const requestId = Date.now()
     lastRequestRef.current = requestId
     setIsFiltering(true)
     
     try {
       const response = await fetch(url)
       // Only update if this is the latest request
       if (lastRequestRef.current === requestId) {
         setProducts(data.products)
       }
     } finally {
       setIsFiltering(false)
     }
   }, [])
   ```

3. **Smart loading states**

   * Giữ lại dữ liệu cũ khi filter

   * Chỉ show loading indicator nhỏ

   * Skeleton loading cho new products

### 🎯 MCP 2: Client-side Caching với SWR/React Query

#### Implementation Plan:

1. **Setup React Query**

   ```bash
   npm install @tanstack/react-query
   ```

2. **Create query hooks**

   ```javascript
   // hooks/useProducts.ts
   export const useProducts = (filters) => {
     return useQuery({
       queryKey: ['products', filters],
       queryFn: () => fetchProducts(filters),
       staleTime: 5 * 60 * 1000, // 5 minutes
       cacheTime: 10 * 60 * 1000, // 10 minutes
       keepPreviousData: true, // Keep old data while fetching new
     })
   }

   export const useProductTypes = () => {
     return useQuery({
       queryKey: ['productTypes'],
       queryFn: fetchProductTypes,
       staleTime: 30 * 60 * 1000, // 30 minutes - rarely changes
     })
   }
   ```

3. **Prefetch next page**

   ```javascript
   const queryClient = useQueryClient()

   useEffect(() => {
     // Prefetch next page when user scrolls to 80% of current page
     if (pagination?.hasNextPage) {
       queryClient.prefetchQuery({
         queryKey: ['products', { ...filters, page: currentPage + 1 }],
         queryFn: () => fetchProducts({ ...filters, page: currentPage + 1 })
       })
     }
   }, [currentPage, filters, pagination])
   ```

4. **Cache invalidation strategy**

   ```javascript
   // Invalidate when user purchases
   const purchaseMutation = useMutation({
     mutationFn: purchaseProduct,
     onSuccess: () => {
       queryClient.invalidateQueries(['products'])
       queryClient.invalidateQueries(['productCounts'])
     }
   })
   ```

### 🎯 MCP 3: Realtime Update với Supabase

#### Implementation Plan:

1. **Setup Supabase realtime**

   ```javascript
   // hooks/useRealtimeProducts.ts
   export const useRealtimeProducts = () => {
     const queryClient = useQueryClient()
     
     useEffect(() => {
       const channel = supabase
         .channel('products-changes')
         .on('postgres_changes', {
           event: '*',
           schema: 'public',
           table: 'products'
         }, (payload) => {
           // Update specific product in cache
           queryClient.setQueryData(['products'], (oldData) => {
             if (!oldData) return oldData
             
             return {
               ...oldData,
               products: oldData.products.map(product => 
                 product._id === payload.new._id ? payload.new : product
               )
             }
           })
         })
         .subscribe()
       
       return () => {
         supabase.removeChannel(channel)
       }
     }, [])
   }
   ```

2. **Cross-tab synchronization**

   ```javascript
   // hooks/useCrossTabSync.ts
   export const useCrossTabSync = () => {
     const queryClient = useQueryClient()
     
     useEffect(() => {
       const handleStorageChange = (e) => {
         if (e.key === 'marketplace-sync') {
           const data = JSON.parse(e.newValue)
           if (data.type === 'product-update') {
             queryClient.invalidateQueries(['products'])
           }
         }
       }
       
       window.addEventListener('storage', handleStorageChange)
       return () => window.removeEventListener('storage', handleStorageChange)
     }, [])
   }
   ```

3. **Optimistic updates**

   ```javascript
   const purchaseMutation = useMutation({
     mutationFn: purchaseProduct,
     onMutate: async (variables) => {
       // Cancel outgoing refetches
       await queryClient.cancelQueries(['products'])
       
       // Snapshot previous value
       const previousProducts = queryClient.getQueryData(['products'])
       
       // Optimistically update
       queryClient.setQueryData(['products'], (old) => ({
         ...old,
         products: old.products.map(p => 
           p._id === variables.productId 
             ? { ...p, availableCount: p.availableCount - variables.quantity }
             : p
         )
       }))
       
       return { previousProducts }
     },
     onError: (err, variables, context) => {
       // Rollback on error
       queryClient.setQueryData(['products'], context.previousProducts)
     }
   })
   ```

### 🎯 MCP 4: Ảnh & Loading Optimization

#### Implementation Plan:

1. **Lazy loading images**

   ```javascript
   // components/LazyImage.tsx
   const LazyImage = ({ src, alt, fallback, className }) => {
     const [imageSrc, setImageSrc] = useState(fallback)
     const [isLoading, setIsLoading] = useState(true)
     const imgRef = useRef()
     
     useEffect(() => {
       const observer = new IntersectionObserver(
         ([entry]) => {
           if (entry.isIntersecting) {
             setImageSrc(src)
             observer.disconnect()
           }
         },
         { threshold: 0.1 }
       )
       
       if (imgRef.current) observer.observe(imgRef.current)
       return () => observer.disconnect()
     }, [src])
     
     return (
       <div ref={imgRef} className={className}>
         {isLoading && <div className="animate-pulse bg-gray-200" />}
         <img 
           src={imageSrc}
           alt={alt}
           onLoad={() => setIsLoading(false)}
           className={isLoading ? 'hidden' : 'block'}
         />
       </div>
     )
   }
   ```

2. **Skeleton loading components**

   ```javascript
   // components/ProductCardSkeleton.tsx
   const ProductCardSkeleton = () => (
     <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
       <div className="flex items-center space-x-2 mb-3">
         <div className="w-10 h-10 bg-gray-200 rounded-xl" />
         <div className="h-4 bg-gray-200 rounded w-20" />
       </div>
       <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
       <div className="h-4 bg-gray-200 rounded w-full mb-3" />
       <div className="h-8 bg-gray-200 rounded w-24 mb-4" />
       <div className="space-y-2">
         <div className="h-10 bg-gray-200 rounded" />
         <div className="h-10 bg-gray-200 rounded" />
       </div>
     </div>
   )
   ```

3. **Progressive loading strategy**

   ```javascript
   const ProductGrid = () => {
     const { data, isLoading, isFetching } = useProducts(filters)
     
     return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
         {data?.products.map(product => (
           <ProductCard key={product._id} product={product} />
         ))}
         
         {/* Show skeletons for loading new content */}
         {isFetching && !isLoading && (
           Array.from({ length: 4 }).map((_, i) => (
             <ProductCardSkeleton key={`skeleton-${i}`} />
           ))
         )}
         
         {/* Show skeletons for initial load */}
         {isLoading && (
           Array.from({ length: 12 }).map((_, i) => (
             <ProductCardSkeleton key={`initial-skeleton-${i}`} />
           ))
         )}
       </div>
     )
   }
   ```

### 🎯 MCP 5: UX/UI Controls

#### Implementation Plan:

1. **Scroll position restoration**

   ```javascript
   // hooks/useScrollRestoration.ts
   export const useScrollRestoration = (key) => {
     useEffect(() => {
       const savedPosition = sessionStorage.getItem(`scroll-${key}`)
       if (savedPosition) {
         window.scrollTo(0, parseInt(savedPosition))
       }
       
       const handleScroll = () => {
         sessionStorage.setItem(`scroll-${key}`, window.scrollY.toString())
       }
       
       window.addEventListener('scroll', handleScroll)
       return () => window.removeEventListener('scroll', handleScroll)
     }, [key])
   }
   ```

2. **Filter state persistence**

   ```javascript
   // hooks/useFilterState.ts
   export const useFilterState = () => {
     const [filters, setFilters] = useState(() => {
       const saved = localStorage.getItem('marketplace-filters')
       return saved ? JSON.parse(saved) : defaultFilters
     })
     
     useEffect(() => {
       localStorage.setItem('marketplace-filters', JSON.stringify(filters))
     }, [filters])
     
     return [filters, setFilters]
   }
   ```

3. **Smart loading indicators**

   ```javascript
   const LoadingOverlay = ({ isVisible, message }) => (
     <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
       isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
     }`}>
       <div className="bg-white shadow-lg rounded-lg px-4 py-2 flex items-center space-x-2">
         <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
         <span className="text-sm text-gray-700">{message}</span>
       </div>
     </div>
   )
   ```

### 🎯 MCP 6: Backend API Improvements

#### Implementation Plan:

1. **Add lastUpdated field**

   ```javascript
   // API response should include:
   {
     products: [...],
     pagination: {...},
     lastUpdated: "2024-01-15T10:30:00Z",
     etag: "abc123" // For conditional requests
   }
   ```

2. **Conditional requests**

   ```javascript
   const fetchProducts = async (filters, etag) => {
     const headers = {}
     if (etag) headers['If-None-Match'] = etag
     
     const response = await fetch(url, { headers })
     
     if (response.status === 304) {
       // No changes, return cached data
       return null
     }
     
     return response.json()
   }
   ```

3. **Infinite scroll support**

   ```javascript
   // hooks/useInfiniteProducts.ts
   export const useInfiniteProducts = (filters) => {
     return useInfiniteQuery({
       queryKey: ['products-infinite', filters],
       queryFn: ({ pageParam = 1 }) => fetchProducts({ ...filters, page: pageParam }),
       getNextPageParam: (lastPage) => 
         lastPage.pagination.hasNextPage ? lastPage.pagination.currentPage + 1 : undefined
     })
   }
   ```

## Timeline Implementation

### Phase 1 (Week 1): Foundation

* [ ] Setup React Query

* [ ] Implement debounce for search

* [ ] Create basic caching structure

* [ ] Add loading skeletons

### Phase 2 (Week 2): Caching & Performance

* [ ] Implement product caching

* [ ] Add prefetching logic

* [ ] Optimize image loading

* [ ] Implement scroll restoration

### Phase 3 (Week 3): Realtime & Sync

* [ ] Setup Supabase realtime

* [ ] Implement cross-tab sync

* [ ] Add optimistic updates

* [ ] Test race condition scenarios

### Phase 4 (Week 4): Polish & Testing

* [ ] Backend API improvements

* [ ] Infinite scroll implementation

* [ ] Performance testing

* [ ] Bug fixes and optimization

## Success Metrics

1. **Performance**

   * Reduce API calls by 60% through caching

   * Improve perceived loading time by 40%

   * Eliminate race conditions

2. **User Experience**

   * Smooth filtering without flickering

   * Instant navigation between cached pages

   * Real-time product updates

   * Consistent state across tabs

3. **Technical**

   * Zero memory leaks

   * Proper error handling

   * Comprehensive test coverage

   * Clean code architecture

## Risk Mitigation

1. **Backward Compatibility**

   * Implement changes incrementally

   * Feature flags for new functionality

   * Fallback to old behavior on errors

2. **Performance Monitoring**

   * Add performance metrics

   * Monitor bundle size

   * Track API response times

3. **Testing Strategy**

   * Unit tests for hooks

   * Integration tests for user flows

   * E2E tests for critical paths

   * Performance regression tests

Việc implementation sẽ được thực hiện theo từng phase, đảm bảo mỗi bước đều được test kỹ lưỡng trước khi chuyển sang bước tiếp theo.

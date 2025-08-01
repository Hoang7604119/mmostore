'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ShoppingCart, Search, Filter, Star, Package, User, LogOut, ArrowLeft, Grid, List, MessageCircle } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import Pagination from '@/components/ui/Pagination'
import { CONTACT_INFO } from '@/config/contact'
import { getProductTypeImage, hasValidImage, getFallbackDisplay } from '@/lib/imageUtils'

interface Product {
  _id: string
  type: string
  title: string
  description: string
  pricePerUnit: number
  quantity: number
  soldCount: number
  category: string
  status: 'pending' | 'approved' | 'rejected' | 'sold_out'
  createdAt: string
  seller: {
    _id: string
    username: string
    email: string
    rating?: number
  }
  availableCount?: number
  totalAccountItems?: number
}

interface User {
  _id: string
  username: string
  email: string
  role: 'admin' | 'manager' | 'seller' | 'buyer'
  credit: number
  isActive: boolean
}

interface ProductType {
  _id: string
  name: string
  displayName: string
  description?: string
  icon?: string
  color: string
  image?: string
  imageUrl?: string
  imageBase64?: string
  finalImageUrl?: string
  order: number
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalProducts: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function MarketplacePage() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [typeSearchTerm, setTypeSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [purchaseQuantity, setPurchaseQuantity] = useState(1)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [productToPurchase, setProductToPurchase] = useState<Product | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [productsPerPage] = useState(12)
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const [productCountsLoaded, setProductCountsLoaded] = useState(false)

  useEffect(() => {
    checkAuth()
    fetchProducts(1)
    fetchProductTypes()
    fetchProductCounts()
  }, [])



  // Refetch products when filters change
  useEffect(() => {
    if (!loading) {
      setCurrentPage(1)
      fetchProducts(1)
    }
  }, [selectedType, categoryFilter, priceRange, searchTerm])

  // Fetch products when page changes
  useEffect(() => {
    if (!loading) {
      fetchProducts(currentPage)
    }
  }, [currentPage])

  // Handle URL query parameter for type
  useEffect(() => {
    const typeParam = searchParams.get('type')
    if (typeParam) {
      setSelectedType(typeParam)
    }
  }, [searchParams])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const fetchProducts = async (page: number = currentPage) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: productsPerPage.toString()
      })
      
      if (selectedType) params.append('type', selectedType)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (priceRange.min) params.append('minPrice', priceRange.min)
      if (priceRange.max) params.append('maxPrice', priceRange.max)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/buyer/products?${params.toString()}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProductTypes = async () => {
    try {
      const response = await fetch('/api/product-types-with-images')
      
      if (response.ok) {
        const data = await response.json()
        setProductTypes(data.productTypes)
      }
    } catch (error) {
      console.error('Error fetching product types:', error)
    }
  }

  const fetchProductCounts = async () => {
    try {
      const response = await fetch('/api/buyer/product-counts')
      
      if (response.ok) {
        const data = await response.json()
        setProductCounts(data.productCounts)
        setProductCountsLoaded(true)
      } else {
        console.error('Failed to fetch product counts:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching product counts:', error)
    }
  }

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage)
    setLoading(true)
    await fetchProducts(newPage)
  }



  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handlePurchaseClick = (product: Product) => {
    if (!user) {
      alert('Vui lòng đăng nhập để mua sản phẩm')
      return
    }
    setProductToPurchase(product)
    setPurchaseQuantity(1)
    setShowPurchaseModal(true)
  }

  const handleMessageSeller = async (sellerId: string) => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/login'
      return
    }
    
    try {
      // Generate conversation ID
      const conversationId = [user._id, sellerId].sort().join('_')
      
      // Check if conversation exists by trying to fetch it
      const checkResponse = await fetch(`/api/messages/${conversationId}`, {
        method: 'GET',
        credentials: 'include'
      })
      
      if (checkResponse.ok) {
        // Conversation exists, redirect to messages page
        window.location.href = `/dashboard/messages`
      } else {
        // Conversation doesn't exist, create it by sending a message
        const createResponse = await fetch('/api/messages/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            content: 'Xin chào! Tôi quan tâm đến sản phẩm của bạn.',
            receiverId: sellerId
          })
        })
        
        if (createResponse.ok) {
          window.location.href = `/dashboard/messages`
        } else {
          alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại.')
        }
      }
    } catch (error) {
      console.error('Error handling message seller:', error)
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
    }
  }

  const handlePurchase = async () => {
    if (!user || !productToPurchase) return

    const totalAmount = productToPurchase.pricePerUnit * purchaseQuantity
    if (user.credit < totalAmount) {
      alert(`❌ Không đủ credit. Bạn có ${user.credit.toLocaleString('vi-VN')} VNĐ, cần ${totalAmount.toLocaleString('vi-VN')} VNĐ`)
      return
    }

    setPurchasing(true)
    try {
      const response = await fetch('/api/buyer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          productId: productToPurchase._id,
          quantity: purchaseQuantity
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Show account details
        const accountsInfo = data.order?.accounts?.map((acc: any) => 
          `Username: ${acc.username}\nPassword: ${acc.password}${acc.email ? `\nEmail: ${acc.email}` : ''}${acc.additionalInfo ? `\nThông tin bổ sung: ${acc.additionalInfo}` : ''}`
        ).join('\n\n---\n\n') || 'Không có thông tin tài khoản'
        
        alert(`🎉 Mua thành công ${purchaseQuantity} tài khoản!\n\n${accountsInfo}\n\nSố credit còn lại: ${data.order?.remainingCredit?.toLocaleString('vi-VN') || '0'} VNĐ`)
        
        // Update user credit in state
        setUser(prev => prev ? { ...prev, credit: data.order?.remainingCredit || 0 } : null)
        
        fetchProducts() // Refresh products
        fetchProductCounts() // Refresh product counts
        setSelectedProduct(null)
        setShowPurchaseModal(false)
        setProductToPurchase(null)
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      console.error('Error purchasing product:', error)
      alert('❌ Lỗi kết nối, vui lòng thử lại')
    } finally {
      setPurchasing(false)
    }
  }

  // Products are already filtered server-side

  const getProductCountByType = (type: string) => {
    return productCounts[type] || 0
  }

  // Helper function to convert hex color to Tailwind classes
  const getColorClasses = (hexColor: string) => {
    const colorMap: { [key: string]: { bg: string; text: string } } = {
      '#3B82F6': { bg: 'bg-blue-50', text: 'text-blue-700' },
      '#EF4444': { bg: 'bg-red-50', text: 'text-red-700' },
      '#10B981': { bg: 'bg-green-50', text: 'text-green-700' },
      '#F59E0B': { bg: 'bg-yellow-50', text: 'text-yellow-700' },
      '#8B5CF6': { bg: 'bg-purple-50', text: 'text-purple-700' },
      '#EC4899': { bg: 'bg-pink-50', text: 'text-pink-700' },
      '#6B7280': { bg: 'bg-gray-50', text: 'text-gray-700' }
    }
    return colorMap[hexColor] || { bg: 'bg-gray-50', text: 'text-gray-700' }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      {user && <Header user={user} onLogout={handleLogout} />}
      
      {!user && (
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">{CONTACT_INFO.COMPANY_NAME}</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Đăng ký
                </Link>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className="flex-1">
        {/* Hero Section - Modern & Clean */}
        <div className="relative bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Marketplace
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto font-medium">
              Nền tảng mua bán tài khoản uy tín và chất lượng
            </p>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <div className="flex items-center bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-gray-700 font-medium">1000+ tài khoản</span>
              </div>
              <div className="flex items-center bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-gray-700 font-medium">Giao dịch an toàn</span>
              </div>
              <div className="flex items-center bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-gray-700 font-medium">Hỗ trợ 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {!selectedType ? (
          /* Type Selection */
          <div className="space-y-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 lg:mb-10 space-y-4 lg:space-y-0">
              <div className="flex-1">
                <h2 className="text-2xl lg:text-3xl font-semibold text-gray-800 mb-2 tracking-tight">
                  Chọn loại tài khoản
                </h2>
                <p className="text-sm lg:text-base text-gray-500 font-medium">
                  Khám phá các nền tảng phổ biến
                </p>
              </div>
              
              {/* Search box for product types - responsive width */}
              <div className="w-full lg:w-72">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={typeSearchTerm}
                    onChange={(e) => setTypeSearchTerm(e.target.value)}
                    className="pl-10 w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 bg-gray-50/50 text-sm placeholder-gray-400 touch-manipulation"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {productTypes
                .filter(type => 
                  type.displayName.toLowerCase().includes(typeSearchTerm.toLowerCase()) ||
                  type.name.toLowerCase().includes(typeSearchTerm.toLowerCase()) ||
                  (type.description && type.description.toLowerCase().includes(typeSearchTerm.toLowerCase()))
                )
                .map((type) => {
                const productCount = getProductCountByType(type.name)
                const colorClasses = getColorClasses(type.color)
                return (
                  <div
                    key={type._id}
                    onClick={() => setSelectedType(type.name)}
                    className="group relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 overflow-hidden"
                  >
                    {/* Background gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Animated border */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-0.5"></div>
                    
                    <div className="relative z-10 text-center">
                      <div className="mb-6 flex justify-center">
                        <div className="relative">
                          {hasValidImage(type) ? (
                            <img 
                              src={getProductTypeImage(type)} 
                              alt={type.displayName}
                              className="w-20 h-20 object-cover rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                              onError={(e) => {
                                const fallback = getFallbackDisplay(type);
                                e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                                  <svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style="stop-color:${fallback.color};stop-opacity:1" />
                                        <stop offset="100%" style="stop-color:${fallback.color}CC;stop-opacity:1" />
                                      </linearGradient>
                                    </defs>
                                    <rect width="80" height="80" fill="url(#grad)" rx="16"/>
                                    <text x="40" y="50" text-anchor="middle" fill="white" font-size="28" font-family="Arial" font-weight="bold">
                                      ${fallback.text}
                                    </text>
                                  </svg>
                                `)}`
                              }}
                            />
                          ) : (
                            (() => {
                              const fallback = getFallbackDisplay(type);
                              return (
                                <div 
                                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                                  style={{ background: `linear-gradient(135deg, ${fallback.color}, ${fallback.color}CC)` }}
                                >
                                  {fallback.text}
                                </div>
                              );
                            })()
                          )}
                          
                          {/* Floating badge */}
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            {productCount}
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                        {type.displayName}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                        {type.description || `Tài khoản ${type.displayName} chất lượng cao`}
                      </p>
                      
                      <div className="flex items-center justify-center space-x-2 bg-gray-50/80 rounded-full px-4 py-2 group-hover:bg-blue-50/80 transition-colors duration-300">
                        <Package className="h-4 w-4 text-gray-500 group-hover:text-blue-500 transition-colors duration-300" />
                        <span className="text-sm text-gray-700 font-semibold group-hover:text-blue-700 transition-colors duration-300">
                          {productCountsLoaded ? `${productCount} sản phẩm có sẵn` : 'Đang tải...'}
                        </span>
                      </div>
                      
                      {/* Hover arrow */}
                      <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="inline-flex items-center text-blue-600 font-medium text-sm">
                          <span>Xem sản phẩm</span>
                          <svg className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Products View */
          <div className="space-y-6">
            {/* Breadcrumb and Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8 space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setSelectedType(null)}
                  className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-blue-600 hover:bg-blue-50 transition-all duration-200 shadow-sm touch-manipulation w-fit"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại
                </button>
                <div className="text-sm text-gray-500">
                  <span>Marketplace</span>
                  <span className="mx-2">›</span>
                  <span className="font-medium text-gray-900">
                    {productTypes.find(t => t.name === selectedType)?.displayName}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end space-x-3">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{products.length}</span> sản phẩm
                </div>
                <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-200 touch-manipulation ${
                      viewMode === 'grid' 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-200 touch-manipulation ${
                      viewMode === 'list' 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-4 sm:p-6 lg:p-8">
              <div className="mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Tìm kiếm và lọc sản phẩm</h3>
                <p className="text-xs sm:text-sm text-gray-600">Sử dụng các bộ lọc bên dưới để tìm sản phẩm phù hợp</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white touch-manipulation"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="pl-12 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white appearance-none cursor-pointer touch-manipulation"
                  >
                    <option value="all">Tất cả danh mục</option>
                    <option value="social">Social</option>
                    <option value="email">Email</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="hotmail">Hotmail</option>
                    <option value="other">Khác</option>
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                <input
                  type="number"
                  placeholder="Giá tối thiểu (VNĐ)"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white touch-manipulation"
                />
                
                <input
                  type="number"
                  placeholder="Giá tối đa (VNĐ)"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white touch-manipulation"
                />
              </div>
              
              {/* Filter summary */}
              {(searchTerm || categoryFilter !== 'all' || priceRange.min || priceRange.max) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-600 font-medium">Bộ lọc đang áp dụng:</span>
                    {searchTerm && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Tìm kiếm: "{searchTerm}"
                      </span>
                    )}
                    {categoryFilter !== 'all' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Danh mục: {categoryFilter}
                      </span>
                    )}
                    {(priceRange.min || priceRange.max) && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Giá: {priceRange.min || '0'} - {priceRange.max || '∞'} VNĐ
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Products Grid/List */}
            {loading ? (
              /* Loading Skeleton */
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-lg border border-blue-100/50 p-6 animate-pulse backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-6 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full w-16 shadow-sm"></div>
                      <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-12 shadow-sm"></div>
                    </div>
                    <div className="h-6 bg-gradient-to-r from-blue-200 to-purple-200 rounded-xl w-3/4 mb-2 shadow-sm"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-blue-200 rounded-lg w-full mb-3 shadow-sm"></div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-4 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg w-20 shadow-sm"></div>
                      <div className="h-4 bg-gradient-to-r from-orange-200 to-red-200 rounded-lg w-16 shadow-sm"></div>
                    </div>
                    <div className="h-8 bg-gradient-to-r from-purple-200 to-pink-200 rounded-xl w-24 mb-4 shadow-sm"></div>
                    <div className="space-y-2">
                      <div className="h-10 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-xl shadow-sm"></div>
                      <div className="h-10 bg-gradient-to-r from-green-200 to-blue-200 rounded-xl shadow-sm"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {products.map((product) => {
                  const typeInfo = productTypes.find(t => t.name === product.type)
                  return (
                    <div key={product._id} className={`${viewMode === 'grid' ? 'group relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300' : 'bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100 flex'}`}>
                      {viewMode === 'grid' ? (
                        /* Grid View */
                        <>
                          {/* Status Badge */}
                          <div className="absolute top-4 right-4 z-10">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${product.status === 'sold_out' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                              {product.status === 'sold_out' ? '❌ Hết hàng' : '✓ Có sẵn'}
                            </span>
                          </div>
                          
                          <div className="p-6">
                            {/* Product Header */}
                            <div className="mb-4">
                              <div className="flex items-center space-x-2 mb-3">
                                {typeInfo && hasValidImage(typeInfo) ? (
                                  <img 
                                    src={getProductTypeImage(typeInfo)} 
                                    alt={typeInfo?.displayName || product.type}
                                    className="w-10 h-10 object-cover rounded-xl shadow-md"
                                    onError={(e) => {
                                      const fallback = getFallbackDisplay(typeInfo);
                                      e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                                        <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                                          <defs>
                                            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                              <stop offset="0%" style="stop-color:${fallback.color};stop-opacity:1" />
                                              <stop offset="100%" style="stop-color:${fallback.color}CC;stop-opacity:1" />
                                            </linearGradient>
                                          </defs>
                                          <rect width="40" height="40" fill="url(#grad)" rx="8"/>
                                          <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-family="Arial" font-weight="bold">
                                            ${fallback.text}
                                          </text>
                                        </svg>
                                      `)}`
                                    }}
                                  />
                                ) : (
                                  (() => {
                                    const fallback = getFallbackDisplay(typeInfo || { displayName: product.type, color: '#6B7280' });
                                    return (
                                      <div 
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                                        style={{ background: `linear-gradient(135deg, ${fallback.color}, ${fallback.color}CC)` }}
                                      >
                                        {fallback.text}
                                      </div>
                                    );
                                  })()
                                )}
                                <div>
                                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${typeInfo ? getColorClasses(typeInfo.color).bg : 'bg-gray-100'} ${typeInfo ? getColorClasses(typeInfo.color).text : 'text-gray-800'}`}>
                                    {typeInfo?.displayName || product.type}
                                  </span>
                                  <div className="text-xs text-gray-500 mt-1">{product.category}</div>
                                </div>
                              </div>
                              
                              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
                                {product.title}
                              </h3>
                            </div>
                            
                            {product.description && (
                              <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                                {product.description}
                              </p>
                            )}
                            
                            {/* Price and Stock Section */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                  {Number(product.pricePerUnit || 0).toLocaleString('vi-VN')} Credit
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-gray-600">Còn lại</div>
                                  <div className="text-lg font-semibold text-green-600">
                                    {product.availableCount || (product.quantity - product.soldCount)}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Stock Progress Bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                <div 
                                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, ((product.availableCount || (product.quantity - product.soldCount)) / product.quantity) * 100)}%`
                                  }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 text-center">
                                {product.soldCount} đã bán / {product.quantity} tổng cộng
                              </div>
                              
                              {/* No accounts warning */}
                              {product.totalAccountItems === 0 && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <div className="flex items-center text-yellow-800">
                                    <span className="text-sm">⚠️ Sản phẩm đang được chuẩn bị tài khoản</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Seller Info */}
                            <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-xl">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                                {product.seller?.username?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{product.seller?.username || 'Unknown'}</div>
                                {product.seller.rating && (
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                                    <span className="text-xs text-gray-600">{product.seller.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="space-y-2">
                              <Link
                                href={`/products/${product._id}`}
                                className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium flex items-center justify-center space-x-2 touch-manipulation"
                              >
                                <span>👁️ Xem chi tiết</span>
                              </Link>
                              

                              
                              {product.status !== 'sold_out' && user && (
                                <button
                                  onClick={() => handlePurchaseClick(product)}
                                  disabled={purchasing || product.totalAccountItems === 0}
                                  className="w-full px-4 py-3 rounded-xl transition-all duration-200 font-semibold transform hover:scale-[1.02] flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 touch-manipulation"
                                >
                                  <span>
                                    {purchasing 
                                      ? '⏳ Đang xử lý...' 
                                      : product.totalAccountItems === 0
                                      ? '⏳ Đang chuẩn bị tài khoản'
                                      : '🛒 Chọn số lượng & Mua'
                                    }
                                  </span>
                                </button>
                              )}
                              {!user && (
                                <Link
                                  href="/auth/login"
                                  className="block w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-center font-semibold transform hover:scale-[1.02] touch-manipulation"
                                >
                                  🔐 Đăng nhập để mua
                                </Link>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        /* List View */
                        <>
                          <div className="flex-1 p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  {typeInfo && hasValidImage(typeInfo) ? (
                                    <img 
                                      src={getProductTypeImage(typeInfo)} 
                                      alt={typeInfo?.displayName || product.type}
                                      className="w-6 h-6 object-cover rounded"
                                      onError={(e) => {
                                        const fallback = getFallbackDisplay(typeInfo);
                                        e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                                          <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                                            <rect width="24" height="24" fill="${fallback.color}" rx="3"/>
                                            <text x="12" y="15" text-anchor="middle" fill="white" font-size="12" font-family="Arial">
                                              ${fallback.text}
                                            </text>
                                          </svg>
                                        `)}`
                                      }}
                                    />
                                  ) : (
                                    (() => {
                                      const fallback = getFallbackDisplay(typeInfo || { displayName: product.type, color: '#6B7280' });
                                      return (
                                        <div 
                                          className="w-6 h-6 rounded flex items-center justify-center text-white font-semibold text-xs"
                                          style={{ backgroundColor: fallback.color }}
                                        >
                                          {fallback.text}
                                        </div>
                                      );
                                    })()
                                  )}
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeInfo ? getColorClasses(typeInfo.color).bg : 'bg-gray-100'} ${typeInfo ? getColorClasses(typeInfo.color).text : 'text-gray-800'}`}>
                                    {typeInfo?.displayName || product.type}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{product.category}</span>
                                </div>
                                
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.title}</h3>
                                
                                {product.description && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                                    {product.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 mr-1" />
                                    <span>{product.seller?.username || 'Unknown'}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Package className="h-4 w-4 mr-1" />
                                    <span>{product.availableCount || (product.quantity - product.soldCount)} còn lại</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-right ml-4">
                                <div className="text-xl font-bold text-blue-600 mb-2">
                                  {Number(product.pricePerUnit || 0).toLocaleString('vi-VN')} Credit
                                </div>
                                
                                <div className="space-y-2">
                                  <Link
                                    href={`/products/${product._id}`}
                                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm text-center block"
                                  >
                                    Chi tiết
                                  </Link>
                                  

                                  
                                  {product.status !== 'sold_out' && user && (
                                    <button
                                      onClick={() => handlePurchaseClick(product)}
                                      disabled={purchasing || product.totalAccountItems === 0}
                                      className="w-full px-4 py-2 rounded-lg transition-colors text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                      {purchasing 
                                        ? 'Đang xử lý...' 
                                        : product.totalAccountItems === 0
                                        ? 'Đang chuẩn bị'
                                        : 'Chọn số lượng & Mua'
                                      }
                                    </button>
                                  )}
                                  {!user && (
                                    <Link
                                      href="/auth/login"
                                      className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
                                    >
                                      Đăng nhập
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            
            {!loading && products.length === 0 && (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Không có sản phẩm nào</h3>
                <p className="mt-1 text-sm text-gray-500">Không tìm thấy sản phẩm phù hợp với bộ lọc của bạn trong loại {productTypes.find(t => t.name === selectedType)?.displayName}.</p>
                <button
                  onClick={() => setSelectedType(null)}
                  className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ← Quay lại chọn loại khác
                </button>
              </div>
            )}

            {/* Pagination */}
            {!loading && products.length > 0 && pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={pagination.limit}
                totalItems={pagination.totalProducts}
              />
            )}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Chi tiết sản phẩm</h3>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tiêu đề</label>
                  <p className="text-lg font-medium text-gray-900">{selectedProduct.title}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/80 p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Loại tài khoản</label>
                    <p className="text-sm font-medium text-gray-900">{selectedProduct.type}</p>
                  </div>
                  <div className="bg-white/80 p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Danh mục</label>
                    <p className="text-sm font-medium text-gray-900">{selectedProduct.category}</p>
                  </div>
                </div>
                
                <div className="bg-white/80 p-4 rounded-xl border border-gray-200 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả</label>
                  <p className="text-sm text-gray-900 leading-relaxed">{selectedProduct.description}</p>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Người bán</label>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedProduct.seller?.username || 'Unknown'} ({selectedProduct.seller?.email || 'Unknown'})
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Giá mỗi tài khoản</label>
                    <p className="text-lg font-bold text-orange-600">
                      {Number(selectedProduct.pricePerUnit || 0).toLocaleString('vi-VN')} Credit
                    </p>
                  </div>
                  <div className="bg-white/80 p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tổng số lượng</label>
                    <p className="text-lg font-medium text-gray-900">{selectedProduct.quantity}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Còn lại</label>
                    <p className="text-lg font-bold text-green-600">
                      {selectedProduct.availableCount || (selectedProduct.quantity - selectedProduct.soldCount)}
                    </p>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200">
                  {/* Nút hành động */}
                  <div className="flex space-x-3 mb-4">
                    {/* Nút xem chi tiết */}
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="flex-1 px-4 py-3 rounded-xl transition-all duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium shadow-sm hover:shadow-md"
                    >
                      Đóng
                    </button>
                  </div>
                  
                  {/* Nút mua hàng */}
                  {selectedProduct.status !== 'sold_out' && user ? (
                    <button
                      onClick={() => handlePurchaseClick(selectedProduct)}
                      disabled={purchasing}
                      className="w-full px-6 py-4 rounded-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {purchasing 
                        ? 'Đang xử lý...' 
                        : 'Chọn số lượng & Mua'
                      }
                    </button>
                  ) : selectedProduct.status === 'sold_out' ? (
                    <div className="text-center py-6">
                      <span className="inline-flex px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 shadow-sm">
                        Sản phẩm đã hết hàng
                      </span>
                    </div>
                  ) : (
                    <Link
                      href="/auth/login"
                      className="block w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center"
                    >
                      Đăng nhập để mua
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Quantity Modal */}
      {showPurchaseModal && productToPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Chọn số lượng mua</h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center space-x-3 mb-3">
                {(() => {
                  const productType = productTypes.find(t => t.name === productToPurchase.type)
                  if (productType && hasValidImage(productType)) {
                    return (
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center bg-gray-100">
                        <img
                          src={getProductTypeImage(productType)}
                          alt={productType.displayName}
                          className="w-12 h-12 object-contain"
                        />
                      </div>
                    )
                  } else {
                    const fallback = getFallbackDisplay(productType || { displayName: productToPurchase.type, color: '#6B7280' });
                    return (
                      <div className="w-16 h-16 rounded-lg flex items-center justify-center" style={{ backgroundColor: fallback.color }}>
                        <div className="text-white font-bold text-xl">
                          {fallback.text}
                        </div>
                      </div>
                    )
                  }
                })()}
                <div>
                  <h4 className="font-medium">{productToPurchase.title}</h4>
                  <p className="text-sm text-gray-600">
                    {Number(productToPurchase.pricePerUnit || 0).toLocaleString()} Credit/sản phẩm
                  </p>
                  <p className="text-sm text-gray-600">
                    Còn lại: {productToPurchase.availableCount || (productToPurchase.quantity - productToPurchase.soldCount)} sản phẩm
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng:
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setPurchaseQuantity(Math.max(1, purchaseQuantity - 1))}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  disabled={purchaseQuantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={productToPurchase.availableCount || (productToPurchase.quantity - productToPurchase.soldCount)}
                  value={purchaseQuantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    const maxQuantity = productToPurchase.availableCount || (productToPurchase.quantity - productToPurchase.soldCount);
                    setPurchaseQuantity(Math.min(Math.max(1, value), maxQuantity));
                  }}
                  className="w-20 text-center border border-gray-300 rounded-md px-2 py-1"
                />
                <button
                  onClick={() => {
                    const maxQuantity = productToPurchase.availableCount || (productToPurchase.quantity - productToPurchase.soldCount);
                    setPurchaseQuantity(Math.min(maxQuantity, purchaseQuantity + 1));
                  }}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  disabled={purchaseQuantity >= (productToPurchase.availableCount || (productToPurchase.quantity - productToPurchase.soldCount))}
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Tổng tiền:</span>
                <span className="font-semibold">
                  {(productToPurchase.pricePerUnit * purchaseQuantity).toLocaleString()} Credit
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Credit hiện tại:</span>
                <span className={(user?.credit || 0) >= (productToPurchase.pricePerUnit * purchaseQuantity) ? 'text-green-600' : 'text-red-600'}>
                  {(user?.credit || 0).toLocaleString()} Credit
                </span>
              </div>
              {user && user.credit < (productToPurchase.pricePerUnit * purchaseQuantity) && (
                <p className="text-red-600 text-sm mt-2">
                  ⚠️ Không đủ credit để mua {purchaseQuantity} sản phẩm
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => handlePurchase()}
                disabled={purchasing || !user || user.credit < (productToPurchase.pricePerUnit * purchaseQuantity)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {purchasing ? 'Đang xử lý...' : 'Xác nhận mua'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      
      <Footer />
    </div>
  )
}
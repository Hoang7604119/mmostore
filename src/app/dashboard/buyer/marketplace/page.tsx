'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Package, Search, Filter, Star, Heart, Eye, LogOut, ArrowLeft, User } from 'lucide-react'
import { UserData } from '@/types/user'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Product {
  _id: string
  title: string
  description: string
  price: number
  category: string
  seller: {
    _id: string
    username: string
    email: string
    rating: number
  }
  status: 'approved' | 'sold_out'
  createdAt: string
  images: string[]
  rating: number
  reviewCount: number
  totalAccountItems?: number
  availableCount?: number
}

export default function BuyerMarketplacePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priceRange, setPriceRange] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        await fetchProducts()
        loadFavorites()
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

    checkAuth()
  }, [router])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/buyer/products', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Hiển thị sản phẩm đã được duyệt và hết hàng
        const availableProducts = data.products?.filter((product: any) => 
          product.status === 'approved' || product.status === 'sold_out'
        ) || []
        setProducts(availableProducts)
      } else {
        console.error('Failed to fetch products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const loadFavorites = () => {
    const savedFavorites = localStorage.getItem('favorites')
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      localStorage.removeItem('user')
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const toggleFavorite = (productId: string) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId]
    
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify(newFavorites))
  }

  const handleBuyProduct = async (product: Product) => {
    // Kiểm tra nếu sản phẩm đã hết hàng
    if (product.status === 'sold_out') {
      alert('Sản phẩm này đã hết hàng!')
      return
    }

    try {
      const response = await fetch('/api/buyer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product._id,
          sellerId: product.seller._id,
          quantity: 1,
          totalAmount: product.price
        })
      })

      if (response.ok) {
        const order = await response.json()
        alert(`Đã tạo đơn hàng thành công cho "${product.title}"!`)
        // Cập nhật lại danh sách sản phẩm để phản ánh trạng thái mới
        await fetchProducts()
      } else {
        const error = await response.json()
        alert(`Lỗi khi tạo đơn hàng: ${error.message}`)
        // Nếu lỗi do hết hàng, cập nhật lại danh sách sản phẩm
        if (error.message.includes('hết hàng') || error.message.includes('sold out')) {
          await fetchProducts()
        }
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Có lỗi xảy ra khi tạo đơn hàng')
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    
    let matchesPrice = true
    if (priceRange !== 'all') {
      const price = product.price
      switch (priceRange) {
        case 'under-200k':
          matchesPrice = price < 200000
          break
        case '200k-500k':
          matchesPrice = price >= 200000 && price < 500000
          break
        case '500k-1m':
          matchesPrice = price >= 500000 && price < 1000000
          break
        case 'over-1m':
          matchesPrice = price >= 1000000
          break
      }
    }
    
    return matchesSearch && matchesCategory && matchesPrice
  })

  const categories = ['Facebook', 'Gmail', 'Instagram', 'X', 'TikTok', 'YouTube', 'LinkedIn']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} onLogout={handleLogout} />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link href="/dashboard/buyer" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại Buyer Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Marketplace
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-green-600">{filteredProducts.length}</span> sản phẩm có sẵn
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            
            <div className="relative">
              <Filter className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
              >
                <option value="all">Tất cả mức giá</option>
                <option value="under-200k">Dưới 200k</option>
                <option value="200k-500k">200k - 500k</option>
                <option value="500k-1m">500k - 1M</option>
                <option value="over-1m">Trên 1M</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {product.title}
                  </h3>
                  <button
                    onClick={() => toggleFavorite(product._id)}
                    className={`p-1 rounded-full transition-colors ${
                      favorites.includes(product._id)
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${favorites.includes(product._id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {product.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className={`text-2xl font-bold ${
                      product.status === 'sold_out' ? 'text-gray-400' : 'text-green-600'
                    }`}>
                      {product.price.toLocaleString('vi-VN')}đ
                    </span>
                    <div className="flex space-x-2">
                      {product.status === 'sold_out' && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                          Hết hàng
                        </span>
                      )}
                      {product.totalAccountItems === 0 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                          Đang chuẩn bị
                        </span>
                      )}
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {product.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 font-medium">{product.rating}</span>
                      <span className="ml-1 text-gray-500">({product.reviewCount})</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <User className="h-4 w-4 mr-1" />
                      <span>{product.seller.username}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-current ml-1" />
                      <span className="text-xs">{product.seller.rating}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setSelectedProduct(product)}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Chi tiết
                  </button>
                  <button
                    onClick={() => handleBuyProduct(product)}
                    disabled={product.status === 'sold_out' || product.totalAccountItems === 0}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center text-sm ${
                      product.status === 'sold_out' || product.totalAccountItems === 0
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    {product.status === 'sold_out' ? 'Hết hàng' : product.totalAccountItems === 0 ? 'Đang chuẩn bị' : 'Mua ngay'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
            <p className="text-sm text-gray-400 mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200/50">
            <div className="p-8">
              <div className="flex items-start justify-between mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {selectedProduct.title}
                </h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <Package className="h-6 w-6 transform rotate-45" />
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">Mô tả sản phẩm</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedProduct.description}</p>
                  </div>
                  
                  <div className="bg-white/80 p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Thông tin chi tiết</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Danh mục:</span>
                        <span className="font-semibold text-gray-900">{selectedProduct.category}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Ngày đăng:</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(selectedProduct.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">Đánh giá:</span>
                        <div className="flex items-center">
                          <Star className="h-5 w-5 text-yellow-400 fill-current" />
                          <span className="ml-2 font-semibold text-gray-900">{selectedProduct.rating}</span>
                          <span className="ml-1 text-gray-500">({selectedProduct.reviewCount} đánh giá)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-100">
                    <h3 className="font-bold text-gray-900 mb-4 text-lg">Thông tin người bán</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-green-100">
                        <span className="text-gray-600 font-medium">Tên:</span>
                        <span className="font-semibold text-gray-900">{selectedProduct.seller.username}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-green-100">
                        <span className="text-gray-600 font-medium">Email:</span>
                        <span className="font-semibold text-gray-900">{selectedProduct.seller.email}</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 font-medium">Đánh giá:</span>
                        <div className="flex items-center">
                          <Star className="h-5 w-5 text-yellow-400 fill-current" />
                          <span className="ml-2 font-semibold text-gray-900">{selectedProduct.seller.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-6 rounded-xl border-2 ${
                    selectedProduct.status === 'sold_out' ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                  }`}>
                    <div className="text-center">
                      <div className={`text-4xl font-bold mb-4 ${
                        selectedProduct.status === 'sold_out' ? 'text-gray-400' : 'text-green-600'
                      }`}>
                        {selectedProduct.price.toLocaleString('vi-VN')}đ
                      </div>
                      {selectedProduct.status === 'sold_out' && (
                        <div className="mb-4">
                          <span className="inline-block px-4 py-2 bg-gradient-to-r from-red-100 to-pink-100 text-red-800 text-sm rounded-xl font-semibold shadow-sm">
                            Sản phẩm đã hết hàng
                          </span>
                        </div>
                      )}
                      {selectedProduct.totalAccountItems === 0 && (
                        <div className="mb-4">
                          <span className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 text-sm rounded-xl font-semibold shadow-sm">
                            Sản phẩm đang được chuẩn bị tài khoản
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          handleBuyProduct(selectedProduct)
                          setSelectedProduct(null)
                        }}
                        disabled={selectedProduct.status === 'sold_out' || selectedProduct.totalAccountItems === 0}
                        className={`w-full py-4 px-8 rounded-xl transition-all duration-200 flex items-center justify-center font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                          selectedProduct.status === 'sold_out' || selectedProduct.totalAccountItems === 0
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                        }`}
                      >
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        {selectedProduct.status === 'sold_out' ? 'Hết hàng' : selectedProduct.totalAccountItems === 0 ? 'Đang chuẩn bị' : 'Mua ngay'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
      
      <Footer />
    </div>
  )
}
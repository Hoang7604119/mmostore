'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Package, Plus, Edit, Trash2, Eye, LogOut, ArrowLeft, Search, Filter } from 'lucide-react'
import { UserData } from '@/types/user'
import Header from '@/components/Header'
import LoadingSpinner from '@/components/LoadingSpinner'
import Pagination, { usePagination } from '@/components/ui/Pagination'

interface User extends UserData {
  credit: number
}

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
  images: string[]
  totalAccounts?: number
  availableAccounts?: number
  soldAccounts?: number
}

export default function SellerProductsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    pricePerUnit: '',
    category: 'facebook'
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 12
  })
  const [statistics, setStatistics] = useState({
    totalProducts: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (!['admin', 'manager', 'seller'].includes(data.user.role)) {
          router.push('/dashboard')
          return
        }
        setUser(data.user)
        await fetchProducts(1, searchTerm, statusFilter)
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

  // Handle search and filter changes
  useEffect(() => {
    if (user) {
      fetchProducts(1, searchTerm, statusFilter)
    }
  }, [searchTerm, statusFilter])

  const handlePageChange = (page: number) => {
    fetchProducts(page, searchTerm, statusFilter)
  }

  const fetchProducts = async (page = 1, search = '', status = 'all') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(status !== 'all' && { status })
      })
      
      const response = await fetch(`/api/seller/products?${params}`, {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        setPagination({
          currentPage: data.pagination.currentPage,
          totalPages: data.pagination.totalPages,
          totalProducts: data.pagination.totalProducts,
          limit: data.pagination.limit
        })
        if (data.statistics) {
          setStatistics(data.statistics)
        }
      } else {
        console.error('Failed to fetch products')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newProduct.title,
          description: newProduct.description,
          pricePerUnit: parseInt(newProduct.pricePerUnit),
          category: newProduct.category
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setProducts([data.product, ...products])
        setNewProduct({ title: '', description: '', pricePerUnit: '', category: 'facebook' })
        setShowAddForm(false)
      } else {
        console.error('Failed to add product')
      }
    } catch (error) {
      console.error('Error adding product:', error)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        const response = await fetch('/api/seller/products', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ productId })
        })
        
        if (response.ok) {
          setProducts(products.filter(p => p._id !== productId))
          alert('Xóa sản phẩm thành công!')
        } else {
          const errorData = await response.json()
          alert(`Lỗi: ${errorData.error || 'Không thể xóa sản phẩm'}`)
          console.error('Failed to delete product:', errorData)
        }
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Lỗi kết nối, vui lòng thử lại')
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ duyệt'
      case 'approved': return 'Đã duyệt'
      case 'rejected': return 'Từ chối'
      case 'sold_out': return 'Hết hàng'
      default: return status
    }
  }

  // Filtering is now handled by the API

  const categories = ['facebook', 'gmail', 'instagram', 'twitter', 'tiktok', 'youtube', 'linkedin', 'other']

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link href="/dashboard/seller" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại Seller Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-3" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Sản Phẩm Của Tôi
              </h1>
            </div>
            <Link
              href="/dashboard/seller/products/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center touch-manipulation w-full sm:w-auto justify-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Tạo sản phẩm mới
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">{statistics.totalProducts}</div>
              <div className="text-xs sm:text-sm text-gray-600">Tổng sản phẩm</div>
            </div>
            <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                {statistics.pendingCount}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Chờ duyệt</div>
            </div>
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-green-600">
                {statistics.approvedCount}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Đã duyệt</div>
            </div>
            <div className="bg-red-50 p-3 sm:p-4 rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-red-600">
                {statistics.rejectedCount}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Từ chối</div>
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
              />
            </div>
            <div className="relative">
              <Filter className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white touch-manipulation w-full sm:w-auto"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
                <option value="sold_out">Hết hàng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {product.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                    {getStatusDisplayName(product.status)}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {product.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Loại:</span>
                    <span className="font-medium capitalize">{product.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Giá/tài khoản:</span>
                    <span className="font-medium text-green-600">
                      {Number(product.pricePerUnit || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Số lượng:</span>
                    <span className="font-medium">
                      {product.availableAccounts || 0}/{product.quantity} còn lại
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Đã bán:</span>
                    <span className="font-medium text-blue-600">
                      {product.soldCount || 0} tài khoản
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ngày tạo:</span>
                    <span className="font-medium">
                      {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <button 
                    onClick={() => setSelectedProduct(product)}
                    className="flex items-center justify-center text-blue-600 hover:text-blue-800 text-sm touch-manipulation py-2 sm:py-0"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Xem chi tiết
                  </button>
                  
                  <div className="flex space-x-2 justify-center sm:justify-end">
                    {product.status !== 'approved' && (
                      <button
                        className="text-gray-600 hover:text-gray-800 p-2 touch-manipulation"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="text-red-600 hover:text-red-800 p-2 touch-manipulation"
                      title="Xóa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có sản phẩm nào</h3>
            <p className="text-gray-500 mb-4">Bạn chưa có sản phẩm nào. Hãy tạo sản phẩm đầu tiên!</p>
            <Link
              href="/dashboard/seller/products/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Tạo sản phẩm mới
            </Link>
          </div>
        )}
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={pagination.limit}
              totalItems={pagination.totalProducts}
            />
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Thêm sản phẩm mới</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus className="h-6 w-6 transform rotate-45" />
                </button>
              </div>
              
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProduct.title}
                    onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập tên sản phẩm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mô tả chi tiết về sản phẩm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Giá (VNĐ) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.pricePerUnit}
                      onChange={(e) => setNewProduct({...newProduct, pricePerUnit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Danh mục *
                    </label>
                    <select
                      required
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Thêm sản phẩm
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Chi tiết sản phẩm
                </h2>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus className="h-6 w-6 transform rotate-45" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedProduct.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProduct.status)}`}>
                    {getStatusDisplayName(selectedProduct.status)}
                  </span>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Mô tả:</h4>
                  <p className="text-gray-600">{selectedProduct.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Giá:</h4>
                    <p className="text-green-600 font-semibold">
                      {Number(selectedProduct.pricePerUnit || 0).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Danh mục:</h4>
                    <p className="text-gray-600">{selectedProduct.category}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Ngày tạo:</h4>
                  <p className="text-gray-600">
                    {new Date(selectedProduct.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                
                {selectedProduct.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-1">Lý do từ chối:</h4>
                    <p className="text-red-600 text-sm">
                      Sản phẩm không đáp ứng tiêu chuẩn chất lượng hoặc vi phạm chính sách.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
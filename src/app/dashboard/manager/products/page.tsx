'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Package, CheckCircle, XCircle, Eye, LogOut, ArrowLeft, Search, Filter, Trash2 } from 'lucide-react'
import { UserData } from '@/types/user'
import Header from '@/components/Header'

interface Product {
  _id: string
  title: string
  description: string
  price: number
  category: string
  seller: {
    username: string
    email: string
  }
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  images: string[]
}

interface UserWithCredit extends UserData {
  credit: number
}

export default function ManagerProductsPage() {
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for status filter from URL params
    const status = searchParams.get('status')
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      setStatusFilter(status)
    }

    const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (!['admin', 'manager'].includes(data.user.role)) {
          router.push('/dashboard')
          return
        }
        setUser(data.user)
        await fetchProducts()
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
  }, [router, searchParams])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/manager/products', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Transform API data to match component interface
        const transformedProducts = data.products.map((product: any) => ({
          _id: product._id,
          title: `Tài khoản ${product.type.charAt(0).toUpperCase() + product.type.slice(1)}`,
          description: product.description || `Tài khoản ${product.type} chất lượng cao`,
          price: product.pricePerUnit || product.price,
          category: product.type.charAt(0).toUpperCase() + product.type.slice(1),
          seller: {
            username: product.sellerId.username,
            email: product.sellerId.email
          },
          status: product.status,
          createdAt: product.createdAt,
          images: []
        }))
        setProducts(transformedProducts)
      } else {
        console.error('Error fetching products:', response.statusText)
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

  const handleApproveProduct = async (productId: string) => {
    try {
      const response = await fetch('/api/manager/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          status: 'approved'
        })
      })
      
      if (response.ok) {
        setProducts(products.map(p => p._id === productId ? { ...p, status: 'approved' as const } : p))
      } else {
        console.error('Error approving product:', response.statusText)
      }
    } catch (error) {
      console.error('Error approving product:', error)
    }
  }

  const handleRejectProduct = async (productId: string) => {
    try {
      const response = await fetch('/api/manager/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          productId,
          status: 'rejected'
        })
      })
      
      if (response.ok) {
        setProducts(products.map(p => p._id === productId ? { ...p, status: 'rejected' as const } : p))
      } else {
        console.error('Error rejecting product:', response.statusText)
      }
    } catch (error) {
      console.error('Error rejecting product:', error)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        const response = await fetch('/api/manager/products', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ productId })
        })
        
        if (response.ok) {
          setProducts(products.filter(p => p._id !== productId))
        } else {
          console.error('Error deleting product:', response.statusText)
        }
      } catch (error) {
        console.error('Error deleting product:', error)
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
      default: return status
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.seller.username.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
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
          <Link href="/dashboard/manager" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại Manager Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">
                Quản Lý Sản Phẩm
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-yellow-600">{products.filter(p => p.status === 'pending').length}</span> chờ duyệt
              </div>
              <Link
                href="/dashboard/manager/products/create"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <Package className="h-4 w-4 mr-2" />
                Tạo sản phẩm
              </Link>
            </div>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên sản phẩm hoặc seller..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
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
                    <span className="text-gray-500">Giá:</span>
                    <span className="font-medium text-green-600">
                      {Number(product.price || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Danh mục:</span>
                    <span className="font-medium">{product.category}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Seller:</span>
                    <span className="font-medium">{product.seller.username}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ngày tạo:</span>
                    <span className="font-medium">
                      {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setSelectedProduct(product)}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Xem chi tiết
                  </button>
                  
                  <div className="flex space-x-2">
                    {product.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveProduct(product._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleRejectProduct(product._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors flex items-center"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Từ chối
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors flex items-center"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>

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
                  <XCircle className="h-6 w-6" />
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
                      {Number(selectedProduct.price || 0).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Danh mục:</h4>
                    <p className="text-gray-600">{selectedProduct.category}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Thông tin seller:</h4>
                  <p className="text-gray-600">
                    {selectedProduct.seller.username} ({selectedProduct.seller.email})
                  </p>
                </div>
                
                <div className="flex space-x-4 pt-4 border-t">
                  {selectedProduct.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleApproveProduct(selectedProduct._id)
                          setSelectedProduct(null)
                        }}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Duyệt sản phẩm
                      </button>
                      <button
                        onClick={() => {
                          handleRejectProduct(selectedProduct._id)
                          setSelectedProduct(null)
                        }}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                      >
                        <XCircle className="h-5 w-5 mr-2" />
                        Từ chối
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      handleDeleteProduct(selectedProduct._id)
                      setSelectedProduct(null)
                    }}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="h-5 w-5 mr-2" />
                    Xóa sản phẩm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
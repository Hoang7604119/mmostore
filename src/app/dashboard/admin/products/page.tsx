'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Package, CheckCircle, XCircle, Eye, LogOut, ArrowLeft, Search, Filter, Plus, Edit, Trash2 } from 'lucide-react'
import { UserData } from '@/types/user'
import Header from '@/components/Header'



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
  sellerId: {
    _id: string
    username: string
    email: string
  }
  totalAccounts?: number
  availableAccounts?: number
  soldAccounts?: number
}

export default function AdminProductsPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.user.role !== 'admin') {
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
  }, [router])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      } else {
        console.error('Error fetching products:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ productId, status: newStatus })
      })
      
      if (response.ok) {
        setProducts(products.map(p => p._id === productId ? { ...p, status: newStatus as any } : p))
        alert('Cập nhật trạng thái thành công!')
      } else {
        const errorData = await response.json()
        alert(`Lỗi: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Lỗi kết nối, vui lòng thử lại')
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        const response = await fetch('/api/admin/products', {
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
          alert(`Lỗi: ${errorData.error}`)
        }
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Lỗi kết nối, vui lòng thử lại')
      }
    }
  }

  const handleEditProduct = async (updatedProduct: Product) => {
    try {
      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: updatedProduct._id,
          title: updatedProduct.title,
          type: updatedProduct.type,
          category: updatedProduct.category,
          pricePerUnit: updatedProduct.pricePerUnit,
          description: updatedProduct.description
        })
      })
      
      if (response.ok) {
        await fetchProducts()
        setShowEditModal(false)
        setEditingProduct(null)
        alert('Cập nhật sản phẩm thành công!')
      } else {
        const errorData = await response.json()
        alert(`Lỗi: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error updating product:', error)
      alert('Lỗi kết nối, vui lòng thử lại')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'sold_out': return 'bg-gray-100 text-gray-800'
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

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/auth/login')
  }



  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sellerId.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter
    const matchesType = typeFilter === 'all' || product.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
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
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/dashboard/admin"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Package className="h-8 w-8 mr-3 text-red-600" />
              Quản Lý Tất Cả Sản Phẩm
            </h1>
            <p className="text-gray-600 mt-2">Toàn quyền quản lý sản phẩm của tất cả người dùng</p>
          </div>
          <Link
            href="/dashboard/admin/products/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo sản phẩm
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tiêu đề, loại, seller..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Từ chối</option>
              <option value="sold_out">Hết hàng</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition-all duration-200 shadow-sm hover:shadow-md appearance-none cursor-pointer"
            >
              <option value="all">Tất cả loại</option>
              <option value="gmail">Gmail</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="other">Khác</option>
            </select>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người bán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá/Số lượng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.type} - {product.category}
                        </div>
                        {product.description && (
                          <div className="text-xs text-gray-400 mt-1">
                            {product.description.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.sellerId.username}</div>
                      <div className="text-sm text-gray-500">{product.sellerId.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(product.pricePerUnit)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {product.soldCount}/{product.quantity} đã bán
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                        {getStatusDisplayName(product.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(product)
                          setShowEditModal(true)
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {product.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(product._id, 'approved')}
                            className="text-green-600 hover:text-green-900"
                            title="Duyệt"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(product._id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                            title="Từ chối"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có sản phẩm nào</h3>
              <p className="mt-1 text-sm text-gray-500">Chưa có sản phẩm nào phù hợp với bộ lọc.</p>
            </div>
          )}
        </div>
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
                  <XCircle className="h-6 w-6" />
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
                
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Người bán</label>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedProduct.sellerId.username} ({selectedProduct.sellerId.email})
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Giá mỗi tài khoản</label>
                    <p className="text-lg font-bold text-orange-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(selectedProduct.pricePerUnit)}
                    </p>
                  </div>
                  <div className="bg-white/80 p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Số lượng</label>
                    <p className="text-lg font-medium text-gray-900">{selectedProduct.quantity} tài khoản</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Đã bán</label>
                    <p className="text-lg font-bold text-blue-600">{selectedProduct.soldCount}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Còn lại</label>
                    <p className="text-lg font-bold text-green-600">{selectedProduct.quantity - selectedProduct.soldCount}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tổng doanh thu</label>
                    <p className="text-lg font-bold text-purple-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(selectedProduct.soldCount * selectedProduct.pricePerUnit)}
                    </p>
                  </div>
                </div>
                
                {selectedProduct.description && (
                  <div className="bg-white/80 p-4 rounded-xl border border-gray-200 shadow-sm">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả</label>
                    <p className="text-sm text-gray-900 leading-relaxed">{selectedProduct.description}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedProduct.status)}`}>
                    {getStatusDisplayName(selectedProduct.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Chỉnh sửa sản phẩm</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingProduct(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault()
                handleEditProduct(editingProduct)
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                  <input
                    type="text"
                    value={editingProduct.title}
                    onChange={(e) => setEditingProduct({...editingProduct, title: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Loại tài khoản</label>
                  <input
                    type="text"
                    value={editingProduct.type}
                    onChange={(e) => setEditingProduct({...editingProduct, type: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="gmail">Gmail</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Giá mỗi tài khoản (VND)</label>
                  <input
                    type="number"
                    value={editingProduct.pricePerUnit}
                    onChange={(e) => setEditingProduct({...editingProduct, pricePerUnit: parseInt(e.target.value)})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    min="1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                  <textarea
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingProduct(null)
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
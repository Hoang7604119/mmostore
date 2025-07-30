'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ShoppingCart, 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Save,
  X
} from 'lucide-react'
import { UserData } from '@/types/user'
import Header from '@/components/Header'
import LoadingSpinner from '@/components/LoadingSpinner'



interface ProductType {
  _id: string
  name: string
  displayName: string
  icon: string
  color: string
  image?: string
  imageBase64?: string
  description?: string
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

interface ProductTypeForm {
  name: string
  displayName: string
  color: string
  image: string
  description: string
  order: number
}

export default function AdminProductTypesPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState<ProductType | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState<ProductTypeForm>({
    name: '',
    displayName: '',
    color: '#3B82F6',
    image: '',
    description: '',
    order: 0
  })
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
          await fetchProductTypes()
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

  const fetchProductTypes = async () => {
    try {
      const response = await fetch('/api/product-types-with-images', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setProductTypes(data.productTypes)
      } else {
        console.error('Error fetching product types:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching product types:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, image: data.url }))
        alert('Upload ảnh thành công!')
      } else {
        const errorData = await response.json()
        alert(`Lỗi upload: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Lỗi upload ảnh')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingType 
        ? '/api/admin/product-types'
        : '/api/admin/product-types'
      
      const method = editingType ? 'PUT' : 'POST'
      const body = editingType 
        ? { ...formData, id: editingType._id }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(body)
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        await fetchProductTypes()
        resetForm()
      } else {
        const errorData = await response.json()
        alert(`Lỗi: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error saving product type:', error)
      alert('Lỗi kết nối, vui lòng thử lại')
    }
  }

  const handleEdit = (productType: ProductType) => {
    setEditingType(productType)
    setFormData({
      name: productType.name,
      displayName: productType.displayName,
      color: productType.color,
      image: productType.image || '',
      description: productType.description || '',
      order: productType.order
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa loại sản phẩm này?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/product-types?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        await fetchProductTypes()
      } else {
        const errorData = await response.json()
        alert(`Lỗi: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error deleting product type:', error)
      alert('Lỗi kết nối, vui lòng thử lại')
    }
  }

  const handleToggleActive = async (productType: ProductType) => {
    try {
      const response = await fetch('/api/admin/product-types', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          id: productType._id,
          isActive: !productType.isActive
        })
      })
      
      if (response.ok) {
        await fetchProductTypes()
      } else {
        const errorData = await response.json()
        alert(`Lỗi: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error toggling active status:', error)
      alert('Lỗi kết nối, vui lòng thử lại')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/auth/login')
  }

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      color: '#3B82F6',
      image: '',
      description: '',
      order: 0
    })
    setEditingType(null)
    setShowForm(false)
  }

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
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Danh sách loại sản phẩm</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Thêm loại mới
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {editingType ? 'Chỉnh sửa loại sản phẩm' : 'Thêm loại sản phẩm mới'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên (slug) *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="facebook, gmail, instagram..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên hiển thị *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Facebook, Gmail, Instagram..."
                    required
                  />
                </div>
                

                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Màu sắc *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#3B82F6"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ảnh đại diện
                  </label>
                  <div className="space-y-3">
                    <input
                       type="file"
                       accept="image/*"
                       onChange={handleImageUpload}
                       disabled={uploading}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                     />
                     {uploading && (
                       <div className="text-sm text-blue-600">
                         Đang upload ảnh...
                       </div>
                     )}
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Hoặc nhập đường dẫn ảnh..."
                    />
                    <div className="mt-2">
                      <img 
                        src={formData.image || '/api/placeholder-image'} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded border"
                        onError={(e) => {
                          // Hiển thị placeholder với chữ cái đầu và màu nền
                          const displayName = formData.displayName || 'N'
                          const color = formData.color || '#6B7280'
                          e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                            <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
                              <rect width="64" height="64" fill="${color}" rx="8"/>
                              <text x="32" y="40" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
                                ${displayName.charAt(0).toUpperCase()}
                              </text>
                            </svg>
                          `)}`
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Mô tả về loại sản phẩm này..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thứ tự sắp xếp
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingType ? 'Cập nhật' : 'Tạo mới'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Product Types Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Màu sắc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thứ tự
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productTypes.map((productType) => (
                <tr key={productType._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {productType.imageBase64 ? (
                        <img 
                          src={productType.imageBase64} 
                          alt={productType.displayName}
                          className="w-10 h-10 object-cover rounded mr-3"
                        />
                      ) : productType.image ? (
                        <img 
                          src={productType.image} 
                          alt={productType.displayName}
                          className="w-10 h-10 object-cover rounded mr-3"
                          onError={(e) => {
                            // Hiển thị placeholder với chữ cái đầu và màu nền
                            const displayName = productType.displayName || productType.name
                            const color = productType.color || '#6B7280'
                            e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                              <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                                <rect width="40" height="40" fill="${color}" rx="6"/>
                                <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-family="Arial">
                                  ${displayName.charAt(0).toUpperCase()}
                                </text>
                              </svg>
                            `)}`
                          }}
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded flex items-center justify-center mr-3"
                          style={{ backgroundColor: productType.color || '#6B7280' }}
                        >
                          <span className="text-white font-bold text-sm">
                            {(productType.displayName || productType.name).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {productType.displayName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {productType.name}
                        </div>
                        {productType.description && (
                          <div className="text-xs text-gray-400 mt-1">
                            {productType.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div 
                        className="w-6 h-6 rounded-full mr-2"
                        style={{ backgroundColor: productType.color }}
                      ></div>
                      <span className="text-sm text-gray-900">{productType.color}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {productType.order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(productType)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        productType.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {productType.isActive ? (
                        <><Eye className="h-3 w-3 mr-1" /> Hiển thị</>
                      ) : (
                        <><EyeOff className="h-3 w-3 mr-1" /> Ẩn</>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(productType.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(productType)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(productType._id)}
                        className="text-red-600 hover:text-red-900"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {productTypes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">Chưa có loại sản phẩm nào</div>
              <button
                onClick={() => setShowForm(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                Tạo loại sản phẩm đầu tiên
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
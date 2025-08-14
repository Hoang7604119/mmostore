'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Star, Package, User, MessageCircle, ShoppingCart, Heart, Share2 } from 'lucide-react'
import Header from '@/components/Header'
import ProductReviews from '@/components/ProductReviews'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { APP_CONFIG } from '@/config/app'
import { getImageUrl } from '@/lib/imageUtils'

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
  rating: number
  reviewCount: number
  seller: {
    _id: string
    username: string
    email: string
    rating?: number
  }
  availableCount?: number
  totalAccountItems?: number
}

interface ProductType {
  _id: string
  name: string
  displayName: string
  description?: string
  icon?: string
  color: string
  image?: string
  imageBase64?: string
  order: number
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, logout } = useAuth()
  const productId = params.productId as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseQuantity, setPurchaseQuantity] = useState(1)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (productId) {
      fetchProduct()
      fetchProductTypes()
    }
  }, [productId])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${productId}`)
      
      if (response.ok) {
        const data = await response.json()
        setProduct(data.product)
      } else {
        console.error('Failed to fetch product')
        router.push('/marketplace')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      router.push('/marketplace')
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

  const handlePurchase = async () => {
    if (!user || !product) return

    try {
      setPurchasing(true)
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: product._id,
          quantity: purchaseQuantity
        })
      })

      if (response.ok) {
        alert('Đặt hàng thành công!')
        setShowPurchaseModal(false)
        fetchProduct() // Refresh product data
      } else {
        const error = await response.json()
        alert(error.message || 'Có lỗi xảy ra khi đặt hàng')
      }
    } catch (error) {
      console.error('Error purchasing product:', error)
      alert('Có lỗi xảy ra khi đặt hàng')
    } finally {
      setPurchasing(false)
    }
  }

  const handleMessageSeller = async (sellerId: string) => {
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/auth/login')
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
        router.push('/dashboard/messages')
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
          router.push('/dashboard/messages')
        } else {
          alert('Không thể tạo cuộc trò chuyện. Vui lòng thử lại.')
        }
      }
    } catch (error) {
      console.error('Error handling message seller:', error)
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
    }
  }

  const handleToggleFavorite = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/favorites/${productId}`, {
        method: isFavorite ? 'DELETE' : 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        setIsFavorite(!isFavorite)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.title,
        text: product?.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Đã sao chép link sản phẩm!')
    }
  }

  const getDefaultImage = (productType: string) => {
    // First try to get image from ProductType database using unified logic
    const productTypeData = productTypes.find(pt => pt.name === productType)
    if (productTypeData) {
      // Use the unified image URL logic from imageUtils
      const imageUrl = getImageUrl(productTypeData)
      if (imageUrl && !imageUrl.includes('/uploads/other.svg')) {
        return imageUrl
      }
    }
    
    // Fallback to APP_CONFIG if not found in database
    return APP_CONFIG.PRODUCTS.DEFAULT_IMAGES[productType as keyof typeof APP_CONFIG.PRODUCTS.DEFAULT_IMAGES] || APP_CONFIG.PRODUCTS.DEFAULT_IMAGES['other']
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!product && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {user && <Header user={user} onLogout={logout} />}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy sản phẩm</h2>
            <p className="text-gray-600 mb-4">Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <button
              onClick={() => router.push('/marketplace')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Quay lại Marketplace
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Header user={user} onLogout={logout} />}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => router.push(`/marketplace?type=${product?.type || ''}`)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Images */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              {product?.images && product.images.length > 0 ? (
                <div className="space-y-4">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  {product.images.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {product.images.slice(1, 4).map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${product.title} ${index + 2}`}
                          className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <img
                    src={getDefaultImage(product?.type || 'other')}
                    alt={product?.title || 'Product'}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center hidden">
                    <Package className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              {/* Product Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product?.title}</h1>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center space-x-1">
                      {renderStars(product?.rating || 0)}
                      <span className="text-sm text-gray-600 ml-2">
                        ({product?.reviewCount || 0} đánh giá)
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-600">
                      Đã bán: {product?.soldCount}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleToggleFavorite}
                    className={`p-2 rounded-full ${
                      isFavorite ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                    } hover:bg-opacity-80`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Price and Status */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Giá mỗi tài khoản</p>
                    <p className="text-3xl font-bold text-blue-900">
                      {Number(product?.pricePerUnit || 0).toLocaleString('vi-VN')} Credit
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Còn lại</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {product?.availableCount || ((product?.quantity || 0) - (product?.soldCount || 0))} / {product?.quantity}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại tài khoản</label>
                  <p className="text-gray-900">{product?.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <p className="text-gray-900">{product?.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    product?.status === 'approved' ? 'bg-green-100 text-green-800' :
                    product?.status === 'sold_out' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {product?.status === 'approved' ? 'Có sẵn' :
                     product?.status === 'sold_out' ? 'Hết hàng' : 'Đang xử lý'
                    }
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày đăng</label>
                  <p className="text-gray-900">
                    {product?.createdAt ? new Date(product.createdAt).toLocaleDateString('vi-VN') : ''}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả sản phẩm</label>
                <p className="text-gray-700 leading-relaxed">{product?.description}</p>
              </div>

              {/* Seller Info */}
              <div className="border-t border-gray-200 pt-6 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin người bán</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{product?.seller?.username}</h4>
                      <p className="text-sm text-gray-600">{product?.seller?.email}</p>
                      {product?.seller?.rating && (
                        <div className="flex items-center space-x-1 mt-1">
                          {renderStars(product.seller.rating)}
                          <span className="text-sm text-gray-600 ml-1">
                            ({product.seller.rating}/5)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleMessageSeller(product?.seller?._id || '')}
                    className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Nhắn tin</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                {product?.status === 'approved' && user ? (
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    <span>Mua ngay</span>
                  </button>
                ) : product?.status === 'sold_out' ? (
                  <div className="flex-1 bg-gray-100 text-gray-500 px-6 py-3 rounded-lg text-center">
                    Sản phẩm đã hết hàng
                  </div>
                ) : !user ? (
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                  >
                    Đăng nhập để mua
                  </button>
                ) : (
                  <div className="flex-1 bg-gray-100 text-gray-500 px-6 py-3 rounded-lg text-center">
                    Sản phẩm chưa được duyệt
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews */}
        <div className="mt-8">
          <ProductReviews productId={productId} sellerId={product?.seller?._id || ''} />
        </div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Xác nhận mua hàng</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng
                </label>
                <input
                  type="number"
                  min="1"
                  max={product?.availableCount || ((product?.quantity || 0) - (product?.soldCount || 0))}
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(parseInt(e.target.value) || 1)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Đơn giá:</span>
                  <span className="font-medium">
                    {Number(product?.pricePerUnit || 0).toLocaleString('vi-VN')} Credit
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Số lượng:</span>
                  <span className="font-medium">{purchaseQuantity}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Tổng cộng:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {Number((product?.pricePerUnit || 0) * purchaseQuantity).toLocaleString('vi-VN')} Credit
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handlePurchase}
                disabled={purchasing}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {purchasing ? 'Đang xử lý...' : 'Xác nhận mua'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
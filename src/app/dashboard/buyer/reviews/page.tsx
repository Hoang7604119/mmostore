'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star, MessageSquare, Filter, Search, Package, User, Calendar, Reply } from 'lucide-react'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/useAuth'

interface Review {
  _id: string
  rating: number
  comment: string
  images: string[]
  isVerifiedPurchase: boolean
  sellerReply?: {
    comment: string
    repliedAt: string
  }
  helpfulCount: number
  createdAt: string
  seller: {
    _id: string
    username: string
  }
  product: {
    _id: string
    title: string
    images: string[]
  }
}

interface Summary {
  totalReviews: number
  averageRating: number
  repliesReceived: number
  replyRate: number
  distribution: { rating: number; count: number }[]
}

export default function BuyerReviewsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    rating: '', // '1', '2', '3', '4', '5'
    hasReply: '' // 'true', 'false'
  })
  const [searchTerm, setSearchTerm] = useState('')

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.rating && { rating: filters.rating }),
        ...(filters.hasReply && { hasReply: filters.hasReply })
      })

      const response = await fetch(`/api/user/reviews?${params}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews)
        setSummary(data.summary)
        setCurrentPage(data.pagination.currentPage)
        setTotalPages(data.pagination.totalPages)
      } else {
        console.error('Failed to fetch reviews')
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [filters])

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

  const filteredReviews = reviews.filter(review => {
    if (!searchTerm) return true
    return (
      review.product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.seller.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (loading && !reviews.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        {user && <Header user={user} onLogout={logout} />}
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải đánh giá...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Header user={user} onLogout={logout} />}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Đánh Giá Của Tôi</h1>
          <p className="text-gray-600">Xem lại các đánh giá bạn đã viết cho sản phẩm</p>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tổng đánh giá</p>
                  <p className="text-2xl font-semibold text-gray-900">{summary.totalReviews}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Đánh giá trung bình</p>
                  <p className="text-2xl font-semibold text-gray-900">{summary.averageRating}/5</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Reply className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Nhận phản hồi</p>
                  <p className="text-2xl font-semibold text-gray-900">{summary.repliesReceived}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">{summary.replyRate}%</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tỷ lệ phản hồi</p>
                  <p className="text-2xl font-semibold text-gray-900">{summary.replyRate}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rating Distribution */}
        {summary && summary.distribution.some(d => d.count > 0) && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Phân bố đánh giá</h3>
            <div className="space-y-2">
              {summary.distribution.map((item) => (
                <div key={item.rating} className="flex items-center">
                  <div className="flex items-center w-16">
                    <span className="text-sm font-medium text-gray-700">{item.rating}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-current ml-1" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${summary.totalReviews > 0 ? (item.count / summary.totalReviews) * 100 : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 w-12">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số sao
              </label>
              <select
                value={filters.rating}
                onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Tất cả</option>
                <option value="5">5 sao</option>
                <option value="4">4 sao</option>
                <option value="3">3 sao</option>
                <option value="2">2 sao</option>
                <option value="1">1 sao</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phản hồi từ seller
              </label>
              <select
                value={filters.hasReply}
                onChange={(e) => setFilters({ ...filters, hasReply: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">Tất cả</option>
                <option value="true">Có phản hồi</option>
                <option value="false">Chưa có phản hồi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên sản phẩm, seller..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {filteredReviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Không tìm thấy đánh giá nào' : 'Bạn chưa viết đánh giá nào'}
              </h3>
              <p className="text-gray-500">
                {searchTerm 
                  ? 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                  : 'Sau khi mua hàng, bạn có thể viết đánh giá cho sản phẩm'
                }
              </p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review._id} className="bg-white rounded-lg shadow p-6">
                {/* Product Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {review.product.images && review.product.images.length > 0 ? (
                        <img
                          src={review.product.images[0]}
                          alt={review.product.title}
                          className="h-12 w-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{review.product.title}</h3>
                      <p className="text-sm text-gray-500">Bán bởi: {review.seller.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>

                {/* Review Content */}
                <div className="mb-4">
                  <p className="text-gray-700">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="flex space-x-2 mt-3">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="h-20 w-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Verified Purchase Badge */}
                {review.isVerifiedPurchase && (
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Đã mua hàng
                    </span>
                  </div>
                )}

                {/* Seller Reply */}
                {review.sellerReply && (
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                    <div className="flex items-center mb-2">
                      <Reply className="h-4 w-4 text-blue-600 mr-2" />
                      <h4 className="font-medium text-blue-900">Phản hồi từ người bán:</h4>
                    </div>
                    <p className="text-blue-800 mb-2">{review.sellerReply.comment}</p>
                    <p className="text-xs text-blue-600">
                      Phản hồi vào {new Date(review.sellerReply.repliedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )}

                {/* Helpful Count */}
                {review.helpfulCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      {review.helpfulCount} người thấy đánh giá này hữu ích
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-gray-700">
              Trang {currentPage} / {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchReviews(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => fetchReviews(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
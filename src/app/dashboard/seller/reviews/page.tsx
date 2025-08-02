'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Star, MessageSquare, Filter, Search, Package, User, Calendar, Reply, Eye, Edit, Trash2 } from 'lucide-react'
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
  user: {
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
  repliedCount: number
  pendingCount: number
  replyRate: number
  distribution: { rating: number; count: number }[]
}

export default function SellerReviewsPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'replied', 'pending'
    rating: '', // '1', '2', '3', '4', '5'
    productId: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showReplyModal, setShowReplyModal] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [editingReply, setEditingReply] = useState(false)

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.rating && { rating: filters.rating }),
        ...(filters.productId && { productId: filters.productId })
      })

      const response = await fetch(`/api/seller/reviews?${params}`, {
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

  const handleReply = async () => {
    if (!selectedReview || !replyText.trim()) return

    setSubmittingReply(true)
    try {
      const url = editingReply 
        ? `/api/reviews/${selectedReview._id}/reply`
        : `/api/reviews/${selectedReview._id}/reply`
      
      const method = editingReply ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ comment: replyText.trim() })
      })

      if (response.ok) {
        alert(editingReply ? 'Phản hồi đã được cập nhật!' : 'Phản hồi đã được gửi!')
        setShowReplyModal(false)
        setSelectedReview(null)
        setReplyText('')
        setEditingReply(false)
        await fetchReviews(currentPage)
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error submitting reply:', error)
      alert('Có lỗi xảy ra khi gửi phản hồi')
    } finally {
      setSubmittingReply(false)
    }
  }

  const handleDeleteReply = async (reviewId: string) => {
    if (!confirm('Bạn có chắc muốn xóa phản hồi này?')) return

    try {
      const response = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        alert('Phản hồi đã được xóa!')
        await fetchReviews(currentPage)
      } else {
        const error = await response.json()
        alert(error.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error deleting reply:', error)
      alert('Có lỗi xảy ra khi xóa phản hồi')
    }
  }

  const openReplyModal = (review: Review, isEdit = false) => {
    setSelectedReview(review)
    setEditingReply(isEdit)
    setReplyText(isEdit ? review.sellerReply?.comment || '' : '')
    setShowReplyModal(true)
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

  const getStatusBadge = (review: Review) => {
    if (review.sellerReply) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Đã phản hồi
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Chờ phản hồi
      </span>
    )
  }

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản Lý Đánh Giá</h1>
          <p className="text-gray-600">Xem và phản hồi đánh giá từ khách hàng</p>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <p className="text-sm font-medium text-gray-500">Đã phản hồi</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.repliedCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-semibold text-sm">{summary.replyRate}%</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Tỷ lệ phản hồi</p>
                    <p className="text-2xl font-semibold text-gray-900">{summary.replyRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân bố đánh giá</h3>
              <div className="space-y-3">
                {summary.distribution.map((item) => {
                  const percentage = summary.totalReviews > 0 ? Math.round((item.count / summary.totalReviews) * 100) : 0
                  return (
                    <div key={item.rating} className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 w-12">
                        <span className="text-sm font-medium">{item.rating}</span>
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center space-x-2 w-16">
                        <span className="text-sm text-gray-600">{item.count}</span>
                        <span className="text-xs text-gray-500">({percentage}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái phản hồi
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chờ phản hồi</option>
                <option value="replied">Đã phản hồi</option>
              </select>
            </div>

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
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên sản phẩm, người mua..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đánh giá nào</h3>
              <p className="text-gray-500">Khi có khách hàng đánh giá sản phẩm, chúng sẽ hiển thị ở đây.</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{review.user.username}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {review.isVerifiedPurchase && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Đã mua hàng
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(review)}
                  </div>
                </div>

                {/* Product Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{review.product.title}</span>
                    </div>
                    <button
                      onClick={() => router.push(`/products/${review.product._id}`)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Xem sản phẩm
                    </button>
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

                {/* Seller Reply */}
                {review.sellerReply ? (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-900">Phản hồi của bạn:</h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openReplyModal(review, true)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteReply(review._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-blue-800">{review.sellerReply.comment}</p>
                    <p className="text-xs text-blue-600 mt-2">
                      Phản hồi vào {new Date(review.sellerReply.repliedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <button
                      onClick={() => openReplyModal(review)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Phản hồi
                    </button>
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

      {/* Reply Modal */}
      {showReplyModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingReply ? 'Chỉnh sửa phản hồi' : 'Phản hồi đánh giá'}
              </h3>
              <button
                onClick={() => setShowReplyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Đánh giá từ {selectedReview.user.username}:</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex mb-2">{renderStars(selectedReview.rating)}</div>
                <p className="text-gray-700">{selectedReview.comment}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phản hồi của bạn:
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Nhập phản hồi của bạn..."
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {replyText.length}/1000 ký tự
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowReplyModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={submittingReply}
              >
                Hủy
              </button>
              <button
                onClick={handleReply}
                disabled={submittingReply || !replyText.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submittingReply ? 'Đang gửi...' : (editingReply ? 'Cập nhật' : 'Gửi phản hồi')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Star, ThumbsUp, MessageSquare, Camera, Reply, ChevronDown, ChevronUp } from 'lucide-react'
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
}

interface ReviewSummary {
  totalReviews: number
  averageRating: number
  distribution: { rating: number; count: number }[]
}

interface ProductReviewsProps {
  productId: string
  sellerId: string
}

export default function ProductReviews({ productId, sellerId }: ProductReviewsProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState('newest')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    images: [] as string[]
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchReviews = async (page = 1, sort = sortBy) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy: sort
      })

      const response = await fetch(`/api/products/${productId}/reviews?${params}`)
      
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
  }, [productId])

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    fetchReviews(1, newSort)
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(reviewForm)
      })

      if (response.ok) {
        setShowReviewForm(false)
        setReviewForm({ rating: 5, comment: '', images: [] })
        fetchReviews() // Refresh reviews
        alert('Đánh giá đã được gửi thành công!')
      } else {
        const error = await response.json()
        alert(error.message || 'Có lỗi xảy ra khi gửi đánh giá')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Có lỗi xảy ra khi gửi đánh giá')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-5 w-5 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={interactive && onRatingChange ? () => onRatingChange(index + 1) : undefined}
      />
    ))
  }

  const toggleReviewExpansion = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews)
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId)
    } else {
      newExpanded.add(reviewId)
    }
    setExpandedReviews(newExpanded)
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading && !reviews.length) {
    return (
      <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-xl border border-blue-100/50 p-6 backdrop-blur-sm">
        <div className="animate-pulse">
          <div className="h-6 bg-gradient-to-r from-purple-200 to-pink-200 rounded-xl w-1/4 mb-4 shadow-sm"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-blue-100/50 pb-4">
                <div className="h-4 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg w-1/3 mb-2 shadow-sm"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200 to-blue-200 rounded-lg w-full mb-2 shadow-sm"></div>
                <div className="h-4 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg w-2/3 shadow-sm"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Đánh giá sản phẩm</h2>
          {user && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Viết đánh giá
            </button>
          )}
        </div>

        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-4xl font-bold text-gray-900">
                  {summary.averageRating.toFixed(1)}
                </div>
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    {renderStars(Math.round(summary.averageRating))}
                  </div>
                  <p className="text-sm text-gray-600">
                    {summary.totalReviews} đánh giá
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {summary.distribution.map((item) => (
                <div key={item.rating} className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 w-8">
                    {item.rating}
                  </span>
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${summary.totalReviews > 0 ? (item.count / summary.totalReviews) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Viết đánh giá của bạn</h3>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Đánh giá *
              </label>
              <div className="flex items-center space-x-1">
                {renderStars(reviewForm.rating, true, (rating) => 
                  setReviewForm({ ...reviewForm, rating })
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhận xét *
              </label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
                required
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sort Options */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Sắp xếp theo:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="highest">Đánh giá cao nhất</option>
            <option value="lowest">Đánh giá thấp nhất</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="divide-y divide-gray-200">
        {reviews.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Chưa có đánh giá nào
            </h3>
            <p className="text-gray-500">
              Hãy là người đầu tiên đánh giá sản phẩm này!
            </p>
          </div>
        ) : (
          reviews.map((review) => {
            const isExpanded = expandedReviews.has(review._id)
            const shouldTruncate = review.comment.length > 200
            
            return (
              <div key={review._id} className="p-6">
                {/* Review Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {review.user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{review.user.username}</h4>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.isVerifiedPurchase && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Đã mua hàng
                    </span>
                  )}
                </div>

                {/* Review Content */}
                <div className="mb-4">
                  <p className="text-gray-700">
                    {shouldTruncate && !isExpanded 
                      ? truncateText(review.comment, 200)
                      : review.comment
                    }
                  </p>
                  {shouldTruncate && (
                    <button
                      onClick={() => toggleReviewExpansion(review._id)}
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2 flex items-center"
                    >
                      {isExpanded ? (
                        <>
                          Thu gọn <ChevronUp className="h-4 w-4 ml-1" />
                        </>
                      ) : (
                        <>
                          Xem thêm <ChevronDown className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex space-x-2 mb-4">
                    {review.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Review image ${index + 1}`}
                        className="h-20 w-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                        onClick={() => window.open(image, '_blank')}
                      />
                    ))}
                  </div>
                )}

                {/* Seller Reply */}
                {review.sellerReply && (
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400 mb-4">
                    <div className="flex items-center mb-2">
                      <Reply className="h-4 w-4 text-blue-600 mr-2" />
                      <h5 className="font-medium text-blue-900">Phản hồi từ người bán:</h5>
                    </div>
                    <p className="text-blue-800 mb-2">{review.sellerReply.comment}</p>
                    <p className="text-xs text-blue-600">
                      {new Date(review.sellerReply.repliedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                )}

                {/* Helpful Count */}
                {review.helpfulCount > 0 && (
                  <div className="flex items-center text-sm text-gray-500">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {review.helpfulCount} người thấy hữu ích
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
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
        </div>
      )}
    </div>
  )
}
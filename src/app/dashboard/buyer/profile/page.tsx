'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  User, 
  ShoppingBag, 
  Package, 
  Heart, 
  Star,
  Calendar,
  CreditCard,
  TrendingUp,
  Eye,
  Award
} from 'lucide-react'
import Header from '@/components/Header'
import { UserData } from '@/types/user'

interface UserWithCredit extends UserData {
  credit: number
  createdAt: string
  updatedAt: string
}

interface BuyerStats {
  totalOrders: number
  totalSpent: number
  favoriteProducts: number
  reviewsGiven: number
  averageOrderValue: number
  loyaltyPoints: number
}

export default function BuyerProfilePage() {
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [stats, setStats] = useState<BuyerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user.role !== 'buyer') {
            router.push('/dashboard')
            return
          }
          setUser(data.user)
          await fetchBuyerStats()
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

  const fetchBuyerStats = async () => {
    try {
      const response = await fetch('/api/buyer/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Fetch buyer stats error:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getBuyerLevel = (totalSpent: number) => {
    if (totalSpent >= 10000000) return { level: 'Platinum', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' }
    if (totalSpent >= 5000000) return { level: 'Gold', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' }
    if (totalSpent >= 1000000) return { level: 'Silver', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' }
    return { level: 'Bronze', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const buyerLevel = stats ? getBuyerLevel(stats.totalSpent) : getBuyerLevel(0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link href="/dashboard/buyer" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại Dashboard
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <ShoppingBag className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hồ sơ Người mua</h1>
                <p className="text-gray-600">Quản lý thông tin và lịch sử mua sắm</p>
              </div>
            </div>
            
            <Link
              href="/dashboard/profile"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <User className="h-4 w-4 mr-2" />
              Chỉnh sửa thông tin
            </Link>
          </div>

          {/* Basic Info & Level */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                <span className="font-medium text-gray-700">Tên người mua</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{user.username}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                <span className="font-medium text-gray-700">Ngày tham gia</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center mb-2">
                <CreditCard className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-700">Số dư tài khoản</span>
              </div>
              <p className="text-lg font-semibold text-green-800">
                {(user.credit || 0).toLocaleString('vi-VN')} VNĐ
              </p>
            </div>

            <div className={`${buyerLevel.bgColor} p-4 rounded-lg border ${buyerLevel.borderColor}`}>
              <div className="flex items-center mb-2">
                <Award className={`h-5 w-5 ${buyerLevel.color} mr-2`} />
                <span className={`font-medium ${buyerLevel.color}`}>Hạng thành viên</span>
              </div>
              <p className={`text-lg font-semibold ${buyerLevel.color}`}>{buyerLevel.level}</p>
            </div>
          </div>
        </div>

        {/* Buyer Statistics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Thống kê mua sắm</h2>
          
          {stats ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Orders */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 font-medium mb-1">Tổng đơn hàng</p>
                    <p className="text-2xl font-bold text-blue-800">{stats.totalOrders}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              {/* Total Spent */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 font-medium mb-1">Tổng chi tiêu</p>
                    <p className="text-2xl font-bold text-green-800">
                      {stats.totalSpent.toLocaleString('vi-VN')} VNĐ
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>

              {/* Average Order Value */}
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 font-medium mb-1">Giá trị đơn hàng TB</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {stats.averageOrderValue.toLocaleString('vi-VN')} VNĐ
                    </p>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              {/* Favorite Products */}
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 font-medium mb-1">Sản phẩm yêu thích</p>
                    <p className="text-2xl font-bold text-red-800">{stats.favoriteProducts}</p>
                  </div>
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
              </div>

              {/* Reviews Given */}
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 font-medium mb-1">Đánh giá đã viết</p>
                    <p className="text-2xl font-bold text-yellow-800">{stats.reviewsGiven}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </div>

              {/* Loyalty Points */}
              <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-600 font-medium mb-1">Điểm tích lũy</p>
                    <p className="text-2xl font-bold text-indigo-800">{stats.loyaltyPoints}</p>
                  </div>
                  <Award className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải thống kê...</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Thao tác nhanh</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/dashboard/buyer/marketplace"
              className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ShoppingBag className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-800">Mua sắm</p>
                <p className="text-sm text-blue-600">Khám phá sản phẩm mới</p>
              </div>
            </Link>

            <Link
              href="/dashboard/buyer/orders"
              className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Package className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-green-800">Đơn hàng</p>
                <p className="text-sm text-green-600">Theo dõi đơn hàng</p>
              </div>
            </Link>

            <Link
              href="/dashboard/buyer/wishlist"
              className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Heart className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <p className="font-medium text-red-800">Yêu thích</p>
                <p className="text-sm text-red-600">Sản phẩm đã lưu</p>
              </div>
            </Link>

            <Link
              href="/dashboard/credit"
              className="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <CreditCard className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-purple-800">Nạp tiền</p>
                <p className="text-sm text-purple-600">Quản lý số dư</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Seller Request Section */}
        {user.sellerRequest && (
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Yêu cầu trở thành người bán</h2>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Trạng thái yêu cầu</p>
                <p className="text-sm text-gray-600">Đã gửi yêu cầu vào {formatDate(user.sellerRequest.requestedAt ? (typeof user.sellerRequest.requestedAt === 'string' ? user.sellerRequest.requestedAt : user.sellerRequest.requestedAt.toString()) : '')}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                user.sellerRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                user.sellerRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {user.sellerRequest.status === 'pending' ? 'Đang chờ duyệt' :
                 user.sellerRequest.status === 'approved' ? 'Đã được duyệt' :
                 'Bị từ chối'}
              </span>
            </div>
            
            {user.sellerRequest.note && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900 mb-2">Ghi chú từ quản lý:</p>
                <p className="text-blue-800">{user.sellerRequest.note}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Heart, Package, User, Star, LogOut, ArrowLeft, ShoppingBag, AlertTriangle } from 'lucide-react'
import { UserData } from '@/types/user'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'

interface UserWithCredit extends UserData {
  credit: number
}

interface BuyerStats {
  totalOrders: number
  totalSpent: number
  favoriteProducts: number
  reviewsGiven: number
  averageOrderValue: number
  loyaltyPoints: number
}

interface RecentOrder {
  _id: string
  orderNumber: string
  productId: {
    title: string
    type: string
  }
  quantity: number
  totalAmount: number
  status: string
  createdAt: string
}

export default function BuyerDashboard() {
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<BuyerStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          // Load stats and orders after user is authenticated
          loadStats()
          loadRecentOrders()
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

  const loadStats = async () => {
    try {
      const response = await fetch('/api/buyer/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const loadRecentOrders = async () => {
    try {
      const response = await fetch('/api/buyer/orders/list?limit=3')
      if (response.ok) {
        const data = await response.json()
        // Get the orders from the correct API structure
        setRecentOrders(data.data?.orders || [])
      }
    } catch (error) {
      console.error('Error loading recent orders:', error)
    } finally {
      setLoadingOrders(false)
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

  if (loading) {
    return <LoadingSpinner />
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
          <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại Dashboard
          </Link>
        </div>

        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center mb-4">
            <ShoppingBag className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">
              Bảng Điều Khiển Người Mua
            </h1>
          </div>
          <p className="text-gray-600">
            Quản lý đơn hàng và theo dõi hoạt động mua sắm
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : stats?.totalOrders || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Yêu thích</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : stats?.favoriteProducts || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đánh giá</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : stats?.reviewsGiven || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng chi tiêu</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loadingStats ? '...' : `${(stats?.totalSpent || 0).toLocaleString('vi-VN')}đ`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Buyer Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Browse Products */}
          <Link href="/marketplace" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Mua Sắm</h3>
                <p className="text-sm text-gray-600">Khám phá sản phẩm</p>
              </div>
            </div>
          </Link>

          {/* Order History */}
          <Link href="/dashboard/buyer/orders" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Lịch Sử Đơn Hàng</h3>
                <p className="text-sm text-gray-600">Xem đơn hàng đã mua</p>
              </div>
            </div>
          </Link>

          {/* Wishlist */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Danh Sách Yêu Thích</h3>
                <p className="text-sm text-gray-600">Sản phẩm đã lưu</p>
              </div>
            </div>
          </div>

          {/* Profile */}
          <Link href="/dashboard/buyer/profile" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Hồ Sơ</h3>
                <p className="text-sm text-gray-600">Cập nhật thông tin</p>
              </div>
            </div>
          </Link>

          {/* Reviews */}
          <Link href="/dashboard/buyer/reviews" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Đánh Giá Của Tôi</h3>
                <p className="text-sm text-gray-600">Xem đánh giá đã viết</p>
              </div>
            </div>
          </Link>

          {/* Reports */}
          <Link href="/dashboard/buyer/reports" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Báo Cáo</h3>
                <p className="text-sm text-gray-600">Xem báo cáo đã gửi</p>
              </div>
            </div>
          </Link>

          {/* Become Seller */}
          {user.sellerRequest?.status === 'pending' ? (
            <Link href="/become-seller/complete-info" className="bg-gradient-to-r from-yellow-500 to-orange-600 p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer text-white block">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-white">Yêu cầu đang chờ duyệt</h3>
                  <p className="text-sm text-yellow-100">
                    {user.sellerRequest.personalInfo && user.sellerRequest.bankAccount 
                      ? 'Xem/Cập nhật thông tin'
                      : 'Hoàn thiện thông tin'}
                  </p>
                </div>
              </div>
            </Link>
          ) : user.sellerRequest?.status === 'rejected' ? (
            <Link href="/become-seller" className="bg-gradient-to-r from-red-500 to-pink-600 p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer text-white block">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-white">Yêu cầu bị từ chối</h3>
                  <p className="text-sm text-red-100">Gửi yêu cầu lại</p>
                </div>
              </div>
            </Link>
          ) : (
            <Link href="/become-seller" className="bg-gradient-to-r from-green-500 to-blue-600 p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer text-white block">
              <div className="flex items-center">
                <div className="bg-white bg-opacity-20 p-3 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-white">Trở Thành Seller</h3>
                  <p className="text-sm text-blue-100">Bắt đầu bán hàng</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Đơn Hàng Gần Đây
            </h2>
            <Link href="/dashboard/buyer/orders" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Xem tất cả
            </Link>
          </div>
          
          {loadingOrders ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Đang tải...</p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có đơn hàng nào</p>
              <p className="text-sm text-gray-400 mt-2">Bắt đầu mua sắm để xem đơn hàng ở đây</p>
              <Link href="/marketplace" className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Khám Phá Sản Phẩm
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {order.productId?.title || `Tài khoản ${order.productId?.type}`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Mã đơn: {order.orderNumber} • Số lượng: {order.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {order.totalAmount.toLocaleString('vi-VN')}đ
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'completed' ? 'Hoàn thành' :
                         order.status === 'pending' ? 'Đang xử lý' :
                         order.status === 'cancelled' ? 'Đã hủy' : order.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buyer Features */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tính Năng Người Mua
          </h2>
          <div className="space-y-2">
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Mua sắm và đặt hàng
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Theo dõi đơn hàng
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Đánh giá sản phẩm
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Lưu sản phẩm yêu thích
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Tương tác với seller
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
              Yêu cầu trở thành seller
            </p>
          </div>
        </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
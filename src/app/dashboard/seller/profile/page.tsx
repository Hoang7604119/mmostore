'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  User, 
  Store, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Eye,
  ShoppingCart,
  Star,
  Calendar
} from 'lucide-react'
import Header from '@/components/Header'
import { UserData } from '@/types/user'

interface UserWithCredit extends UserData {
  credit: number
  createdAt: string
  updatedAt: string
}

interface SellerStats {
  totalProducts: number
  totalSales: number
  totalRevenue: number
  averageRating: number
  totalViews: number
  pendingOrders: number
}

export default function SellerProfilePage() {
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user.role !== 'seller') {
            router.push('/dashboard')
            return
          }
          setUser(data.user)
          await fetchSellerStats()
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

  const fetchSellerStats = async () => {
    try {
      const response = await fetch('/api/seller/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Fetch seller stats error:', error)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link href="/dashboard/seller" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại Dashboard
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <Store className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hồ sơ Người bán</h1>
                <p className="text-gray-600">Quản lý thông tin và thống kê bán hàng</p>
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

          {/* Basic Info */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                <span className="font-medium text-gray-700">Tên người bán</span>
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
                <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-700">Số dư tài khoản</span>
              </div>
              <p className="text-lg font-semibold text-green-800">
                {(user.credit || 0).toLocaleString('vi-VN')} VNĐ
              </p>
            </div>
          </div>
        </div>

        {/* Seller Statistics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Thống kê bán hàng</h2>
          
          {stats ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Products */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 font-medium mb-1">Tổng sản phẩm</p>
                    <p className="text-2xl font-bold text-blue-800">{stats.totalProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              {/* Total Sales */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 font-medium mb-1">Đơn hàng đã bán</p>
                    <p className="text-2xl font-bold text-green-800">{stats.totalSales}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-green-600" />
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 font-medium mb-1">Tổng doanh thu</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {stats.totalRevenue.toLocaleString('vi-VN')} VNĐ
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              {/* Average Rating */}
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 font-medium mb-1">Đánh giá trung bình</p>
                    <div className="flex items-center">
                      <p className="text-2xl font-bold text-yellow-800 mr-2">
                        {stats.averageRating.toFixed(1)}
                      </p>
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    </div>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </div>

              {/* Total Views */}
              <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-600 font-medium mb-1">Lượt xem sản phẩm</p>
                    <p className="text-2xl font-bold text-indigo-800">{stats.totalViews}</p>
                  </div>
                  <Eye className="h-8 w-8 text-indigo-600" />
                </div>
              </div>

              {/* Pending Orders */}
              <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 font-medium mb-1">Đơn hàng chờ xử lý</p>
                    <p className="text-2xl font-bold text-orange-800">{stats.pendingOrders}</p>
                  </div>
                  <Package className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải thống kê...</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Thao tác nhanh</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/dashboard/seller/products/create"
              className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Package className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-green-800">Tạo sản phẩm mới</p>
                <p className="text-sm text-green-600">Thêm sản phẩm vào cửa hàng</p>
              </div>
            </Link>

            <Link
              href="/dashboard/seller/products"
              className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Store className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-800">Quản lý sản phẩm</p>
                <p className="text-sm text-blue-600">Xem và chỉnh sửa sản phẩm</p>
              </div>
            </Link>

            <Link
              href="/dashboard/seller/orders"
              className="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <ShoppingCart className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-purple-800">Đơn hàng</p>
                <p className="text-sm text-purple-600">Xử lý đơn hàng mới</p>
              </div>
            </Link>

            <Link
              href="/dashboard/credit"
              className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <DollarSign className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <p className="font-medium text-yellow-800">Quản lý credit</p>
                <p className="text-sm text-yellow-600">Nạp và rút tiền</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
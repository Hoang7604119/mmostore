'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Package, Plus, TrendingUp, DollarSign, LogOut, ArrowLeft, Store, AlertTriangle, Star } from 'lucide-react'
import { UserData } from '@/types/user'
import Header from '@/components/Header'

interface User extends UserData {
  credit: number
}

interface SellerStats {
  totalProducts: number
  pendingProducts: number
  approvedProducts: number
  rejectedProducts: number
  totalSoldCount: number
  averageRating: number
  totalOrders: number
  completedOrders: number
  totalRevenue: number
  completedRevenue: number
  averageOrderValue: number
  conversionRate: number
}

export default function SellerDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (!['admin', 'manager', 'seller'].includes(data.user.role)) {
            router.push('/dashboard')
            return
          }
          setUser(data.user)
          
          // Fetch seller stats
          const statsResponse = await fetch('/api/seller/stats')
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            setStats(statsData.stats)
          }
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
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
            <Store className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">
              Bảng Điều Khiển Người Bán
            </h1>
          </div>
          <p className="text-gray-600">
            Quản lý sản phẩm và theo dõi doanh số bán hàng
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
                <p className="text-sm font-medium text-gray-600">Sản phẩm</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Doanh thu</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.completedRevenue?.toLocaleString('vi-VN') || 0}đ</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingProducts || 0}</p>
              </div>
            </div>
          </div>
        </div>



        {/* Seller Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Add Product */}
          <Link href="/dashboard/seller/products/create" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Thêm Sản Phẩm</h3>
                <p className="text-sm text-gray-600">Đăng sản phẩm mới</p>
              </div>
            </div>
          </Link>

          {/* Manage Products */}
          <Link href="/dashboard/seller/products" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Quản Lý Sản Phẩm</h3>
                <p className="text-sm text-gray-600">Chỉnh sửa sản phẩm</p>
              </div>
            </div>
          </Link>

          {/* Orders */}
          <Link href="/dashboard/seller/orders" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Đơn hàng đã bán được</h3>
                <p className="text-sm text-gray-600">Quản lý các đơn hàng đã bán</p>
              </div>
            </div>
          </Link>

          {/* Reviews */}
          <Link href="/dashboard/seller/reviews" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Quản Lý Đánh Giá</h3>
                <p className="text-sm text-gray-600">Xem và phản hồi đánh giá</p>
              </div>
            </div>
          </Link>

          {/* Reports */}
          <Link href="/dashboard/seller/reports" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Báo Cáo</h3>
                <p className="text-sm text-gray-600">Xem báo cáo sản phẩm</p>
              </div>
            </div>
          </Link>

          {/* Sales Analytics */}
          <Link href="/dashboard/seller/stats" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Thống Kê</h3>
                <p className="text-sm text-gray-600">Xem báo cáo bán hàng</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Products */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sản Phẩm Gần Đây
          </h2>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Chưa có sản phẩm nào</p>
            <p className="text-sm text-gray-400 mt-2">Bắt đầu bằng cách thêm sản phẩm đầu tiên của bạn</p>
            <Link href="/dashboard/seller/products/create" className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-block">
              Thêm Sản Phẩm
            </Link>
          </div>
        </div>

        {/* Seller Privileges */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quyền hạn Người Bán
          </h2>
          <div className="space-y-2">
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Đăng và quản lý sản phẩm
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Xem thống kê bán hàng
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Quản lý đơn hàng
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Tương tác với khách hàng
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
              Cập nhật thông tin cửa hàng
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
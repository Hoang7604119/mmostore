'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, DollarSign, ShoppingCart, Package, Star, AlertTriangle, ShoppingBag, Plus } from 'lucide-react'
import Header from '@/components/Header'
import { useAuth } from '@/hooks/useAuth'

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

export default function SellerStatsPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<SellerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/auth/login')
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/seller/stats', {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login')
          return
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Không thể tải thống kê (${response.status}): ${errorData.error || response.statusText}`)
      }

      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Fetch stats error:', error)
      setError(error instanceof Error ? error.message : 'Không thể tải thống kê')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    )
  }



  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchStats}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link href="/dashboard/seller" className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Thống Kê Bán Hàng</h1>
              <p className="text-gray-600 mt-1">Xem chi tiết hiệu suất kinh doanh của bạn</p>
            </div>
          </div>
        </div>

        {/* Basic Stats */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Thống Kê Tổng Quan</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalRevenue?.toLocaleString('vi-VN') || 0}đ</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đơn hàng</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.pendingProducts || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Chi Tiết Sản Phẩm</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-emerald-100 p-3 rounded-full">
                  <Package className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đã duyệt</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.approvedProducts || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-amber-100 p-3 rounded-full">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đánh giá TB</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.averageRating?.toFixed(1) || '0.0'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-cyan-100 p-3 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-cyan-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đã bán</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalSoldCount || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-rose-100 p-3 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-rose-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Bị từ chối</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.rejectedProducts || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Chỉ Số Hiệu Suất</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-indigo-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Giá trị ĐH TB</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.averageOrderValue?.toLocaleString('vi-VN') || 0}đ</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-teal-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-teal-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tỷ lệ bán hàng</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.conversionRate || 0}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="bg-violet-100 p-3 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-violet-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">ĐH hoàn thành</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.completedOrders || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Phân Tích Doanh Thu</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Tổng Doanh Thu</h3>
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">{stats?.totalRevenue?.toLocaleString('vi-VN') || 0}đ</p>
              <p className="text-sm text-gray-600 mt-2">Từ {stats?.totalOrders || 0} đơn hàng</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Doanh Thu Hoàn Thành</h3>
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-blue-600">{stats?.completedRevenue?.toLocaleString('vi-VN') || 0}đ</p>
              <p className="text-sm text-gray-600 mt-2">Từ {stats?.completedOrders || 0} đơn hàng hoàn thành</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hành Động Nhanh</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/seller/products/create" className="bg-green-50 hover:bg-green-100 p-4 rounded-lg transition-colors text-center">
              <Plus className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-800">Thêm Sản Phẩm</p>
            </Link>
            
            <Link href="/dashboard/seller/products" className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg transition-colors text-center">
              <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-blue-800">Quản Lý Sản Phẩm</p>
            </Link>
            
            <Link href="/dashboard/seller/orders" className="bg-orange-50 hover:bg-orange-100 p-4 rounded-lg transition-colors text-center">
              <ShoppingCart className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-orange-800">Xem Đơn Hàng</p>
            </Link>
            
            <Link href="/dashboard/seller/reviews" className="bg-yellow-50 hover:bg-yellow-100 p-4 rounded-lg transition-colors text-center">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-yellow-800">Quản Lý Đánh Giá</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  User, 
  UserCog, 
  Users, 
  Package, 
  ShoppingCart,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  UserCheck,
  Store,
  CheckCircle,
  Clock
} from 'lucide-react'
import Header from '@/components/Header'
import { UserData } from '@/types/user'

interface UserWithCredit extends UserData {
  credit: number
  createdAt: string
  updatedAt: string
}

interface ManagerStats {
  managedSellers: number
  managedProducts: number
  pendingProducts: number
  approvedProducts: number
  rejectedProducts: number
  totalOrders: number
  monthlyRevenue: number
  pendingSellerRequests: number
  completedTasks: number
  pendingTasks: number
}

export default function ManagerProfilePage() {
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [stats, setStats] = useState<ManagerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user.role !== 'manager') {
            router.push('/dashboard')
            return
          }
          setUser(data.user)
          await fetchManagerStats()
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

  const fetchManagerStats = async () => {
    try {
      const response = await fetch('/api/manager/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Fetch manager stats error:', error)
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

  const getTaskCompletionRate = () => {
    if (!stats || (stats.completedTasks + stats.pendingTasks) === 0) return 0
    return Math.round((stats.completedTasks / (stats.completedTasks + stats.pendingTasks)) * 100)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link href="/dashboard/manager" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại Dashboard
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <UserCog className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hồ sơ Quản lý</h1>
                <p className="text-gray-600">Quản lý người bán và sản phẩm</p>
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
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                <span className="font-medium text-gray-700">Tên quản lý</span>
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
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center mb-2">
                <UserCog className="h-5 w-5 text-purple-600 mr-2" />
                <span className="font-medium text-purple-700">Vai trò</span>
              </div>
              <p className="text-lg font-semibold text-purple-800">Quản lý</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-700">Tỷ lệ hoàn thành</span>
              </div>
              <p className="text-lg font-semibold text-green-800">{getTaskCompletionRate()}%</p>
            </div>
          </div>
        </div>

        {/* Management Statistics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Thống kê quản lý</h2>
          
          {stats ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Managed Sellers */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 font-medium mb-1">Người bán quản lý</p>
                    <p className="text-2xl font-bold text-blue-800">{stats.managedSellers}</p>
                  </div>
                  <Store className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              {/* Managed Products */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 font-medium mb-1">Sản phẩm quản lý</p>
                    <p className="text-2xl font-bold text-green-800">{stats.managedProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-green-600" />
                </div>
              </div>

              {/* Pending Products */}
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-600 font-medium mb-1">Sản phẩm chờ duyệt</p>
                    <p className="text-2xl font-bold text-yellow-800">{stats.pendingProducts}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>

              {/* Approved Products */}
              <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 font-medium mb-1">Sản phẩm đã duyệt</p>
                    <p className="text-2xl font-bold text-emerald-800">{stats.approvedProducts}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 font-medium mb-1">Đơn hàng theo dõi</p>
                    <p className="text-2xl font-bold text-purple-800">{stats.totalOrders}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              {/* Monthly Revenue */}
              <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-600 font-medium mb-1">Doanh thu tháng</p>
                    <p className="text-2xl font-bold text-indigo-800">
                      {stats.monthlyRevenue.toLocaleString('vi-VN')} VNĐ
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-indigo-600" />
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

        {/* Pending Tasks */}
        {stats && (stats.pendingSellerRequests > 0 || stats.pendingProducts > 0) && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Công việc cần xử lý</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {stats.pendingSellerRequests > 0 && (
                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 font-medium mb-1">Yêu cầu người bán</p>
                      <p className="text-2xl font-bold text-orange-800">{stats.pendingSellerRequests}</p>
                      <p className="text-sm text-orange-600 mt-1">Cần xem xét</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              )}

              {stats.pendingProducts > 0 && (
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-600 font-medium mb-1">Sản phẩm chờ duyệt</p>
                      <p className="text-2xl font-bold text-yellow-800">{stats.pendingProducts}</p>
                      <p className="text-sm text-yellow-600 mt-1">Cần phê duyệt</p>
                    </div>
                    <Package className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Thao tác nhanh</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/dashboard/manager/sellers"
              className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Store className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-800">Quản lý người bán</p>
                <p className="text-sm text-blue-600">Xem và hỗ trợ</p>
              </div>
            </Link>

            <Link
              href="/dashboard/manager/products"
              className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Package className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-green-800">Duyệt sản phẩm</p>
                <p className="text-sm text-green-600">Phê duyệt và từ chối</p>
              </div>
            </Link>

            <Link
              href="/dashboard/manager/orders"
              className="flex items-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <ShoppingCart className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <p className="font-medium text-purple-800">Theo dõi đơn hàng</p>
                <p className="text-sm text-purple-600">Giám sát giao dịch</p>
              </div>
            </Link>

            <Link
              href="/dashboard/manager/analytics"
              className="flex items-center p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <BarChart3 className="h-6 w-6 text-orange-600 mr-3" />
              <div>
                <p className="font-medium text-orange-800">Báo cáo</p>
                <p className="text-sm text-orange-600">Thống kê khu vực</p>
              </div>
            </Link>

            <Link
              href="/dashboard/manager/seller-requests"
              className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <UserCheck className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <p className="font-medium text-yellow-800">Yêu cầu người bán</p>
                <p className="text-sm text-yellow-600">Xem xét đăng ký</p>
              </div>
            </Link>

            <Link
              href="/dashboard/manager/support"
              className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <p className="font-medium text-red-800">Hỗ trợ</p>
                <p className="text-sm text-red-600">Giải quyết vấn đề</p>
              </div>
            </Link>

            <Link
              href="/dashboard/manager/users"
              className="flex items-center p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Users className="h-6 w-6 text-indigo-600 mr-3" />
              <div>
                <p className="font-medium text-indigo-800">Người dùng</p>
                <p className="text-sm text-indigo-600">Quản lý tài khoản</p>
              </div>
            </Link>

            <Link
              href="/dashboard/credit"
              className="flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <CreditCard className="h-6 w-6 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-800">Quản lý Credit</p>
                <p className="text-sm text-gray-600">Nạp tiền tài khoản</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
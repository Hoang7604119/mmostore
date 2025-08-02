'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Users, 
  Package, 
  ShoppingCart,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Settings,
  BarChart3,
  UserCheck,
  Store
} from 'lucide-react'
import Header from '@/components/Header'
import { UserData } from '@/types/user'

interface UserWithCredit extends UserData {
  credit: number
  createdAt: string
  updatedAt: string
}

interface AdminStats {
  totalUsers: number
  totalSellers: number
  totalBuyers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingSellerRequests: number
  activeReports: number
  systemHealth: 'good' | 'warning' | 'critical'
}

export default function AdminProfilePage() {
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user.role !== 'admin') {
            router.push('/dashboard')
            return
          }
          setUser(data.user)
          await fetchAdminStats()
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

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Fetch admin stats error:', error)
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

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSystemHealthText = (health: string) => {
    switch (health) {
      case 'good': return 'Tốt'
      case 'warning': return 'Cảnh báo'
      case 'critical': return 'Nghiêm trọng'
      default: return 'Không xác định'
    }
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
          <Link href="/dashboard/admin" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại Dashboard
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hồ sơ Quản trị viên</h1>
                <p className="text-gray-600">Quản lý hệ thống và giám sát hoạt động</p>
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
                <span className="font-medium text-gray-700">Tên quản trị viên</span>
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
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center mb-2">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-700">Quyền hạn</span>
              </div>
              <p className="text-lg font-semibold text-blue-800">Toàn quyền</p>
            </div>

            <div className={`p-4 rounded-lg border ${
              stats ? getSystemHealthColor(stats.systemHealth) : 'text-gray-600 bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center mb-2">
                <AlertTriangle className={`h-5 w-5 mr-2 ${
                  stats?.systemHealth === 'good' ? 'text-green-600' :
                  stats?.systemHealth === 'warning' ? 'text-yellow-600' :
                  stats?.systemHealth === 'critical' ? 'text-red-600' : 'text-gray-600'
                }`} />
                <span className="font-medium">Tình trạng hệ thống</span>
              </div>
              <p className="text-lg font-semibold">
                {stats ? getSystemHealthText(stats.systemHealth) : 'Đang tải...'}
              </p>
            </div>
          </div>
        </div>

        {/* System Statistics */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Thống kê hệ thống</h2>
          
          {stats ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Total Users */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 font-medium mb-1">Tổng người dùng</p>
                    <p className="text-2xl font-bold text-blue-800">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              {/* Total Sellers */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 font-medium mb-1">Người bán</p>
                    <p className="text-2xl font-bold text-green-800">{stats.totalSellers}</p>
                  </div>
                  <Store className="h-8 w-8 text-green-600" />
                </div>
              </div>

              {/* Total Buyers */}
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 font-medium mb-1">Người mua</p>
                    <p className="text-2xl font-bold text-purple-800">{stats.totalBuyers}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              {/* Total Products */}
              <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 font-medium mb-1">Tổng sản phẩm</p>
                    <p className="text-2xl font-bold text-orange-800">{stats.totalProducts}</p>
                  </div>
                  <Package className="h-8 w-8 text-orange-600" />
                </div>
              </div>

              {/* Total Orders */}
              <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-600 font-medium mb-1">Tổng đơn hàng</p>
                    <p className="text-2xl font-bold text-indigo-800">{stats.totalOrders}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-indigo-600" />
                </div>
              </div>

              {/* Total Revenue */}
              <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-600 font-medium mb-1">Tổng doanh thu</p>
                    <p className="text-2xl font-bold text-emerald-800">
                      {stats.totalRevenue.toLocaleString('vi-VN')} VNĐ
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
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
        {stats && (stats.pendingSellerRequests > 0 || stats.activeReports > 0) && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Công việc cần xử lý</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {stats.pendingSellerRequests > 0 && (
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-600 font-medium mb-1">Yêu cầu trở thành người bán</p>
                      <p className="text-2xl font-bold text-yellow-800">{stats.pendingSellerRequests}</p>
                      <p className="text-sm text-yellow-600 mt-1">Đang chờ duyệt</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              )}

              {stats.activeReports > 0 && (
                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-600 font-medium mb-1">Báo cáo cần xử lý</p>
                      <p className="text-2xl font-bold text-red-800">{stats.activeReports}</p>
                      <p className="text-sm text-red-600 mt-1">Cần xem xét</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-600" />
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
              href="/dashboard/admin/users"
              className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Users className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-800">Quản lý người dùng</p>
                <p className="text-sm text-blue-600">Xem và quản lý tài khoản</p>
              </div>
            </Link>

            <Link
              href="/dashboard/admin/products"
              className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Package className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-green-800">Quản lý sản phẩm</p>
                <p className="text-sm text-green-600">Duyệt và kiểm duyệt</p>
              </div>
            </Link>



            <Link
              href="/dashboard/admin/reports"
              className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <p className="font-medium text-red-800">Báo cáo vi phạm</p>
                <p className="text-sm text-red-600">Xử lý khiếu nại</p>
              </div>
            </Link>


          </div>
        </div>
      </div>
    </div>
  )
}
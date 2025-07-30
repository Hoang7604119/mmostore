'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Users, Package, CheckCircle, LogOut, ArrowLeft, UserCheck, AlertTriangle } from 'lucide-react'
import { UserData } from '@/types/user'
import Header from '@/components/Header'

interface User extends UserData {
  credit: number
}

interface Stats {
  pendingCount: number
  approvedCount: number
  rejectedCount: number
  totalCount: number
}

export default function ManagerDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (!['admin', 'manager'].includes(data.user.role)) {
            router.push('/dashboard')
            return
          }
          setUser(data.user)
          await fetchStats()
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

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/manager/stats', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Error fetching stats:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
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
            <UserCheck className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">
              Bảng Điều Khiển Quản Lý
            </h1>
          </div>
          <p className="text-gray-600">
            Duyệt sản phẩm và quản lý người dùng
          </p>
        </div>

        {/* Manager Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Product Approval */}
          <Link href="/dashboard/manager/products?status=pending" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Duyệt Sản Phẩm</h3>
                <p className="text-sm text-gray-600">Xem và duyệt sản phẩm từ seller</p>
              </div>
            </div>
          </Link>

          {/* User Management */}
          <Link href="/dashboard/manager/users" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Quản Lý User</h3>
                <p className="text-sm text-gray-600">Phân quyền buyer thành seller</p>
              </div>
            </div>
          </Link>

          {/* Product Management */}
          <Link href="/dashboard/manager/products" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Quản Lý Sản Phẩm</h3>
                <p className="text-sm text-gray-600">Xem tất cả sản phẩm</p>
              </div>
            </div>
          </Link>

          {/* Reports Management */}
          <Link href="/dashboard/admin/reports" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Quản Lý Báo Cáo</h3>
                <p className="text-sm text-gray-600">Xử lý báo cáo từ người mua</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Sản Phẩm Chờ Duyệt
            </h2>
            <Link 
              href="/dashboard/manager/products?status=pending"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Xem tất cả →
            </Link>
          </div>
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-800">
                  {stats.pendingCount}
                </div>
                <div className="text-sm text-yellow-600">Chờ duyệt</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-800">
                  {stats.approvedCount}
                </div>
                <div className="text-sm text-green-600">Đã duyệt</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-800">
                  {stats.rejectedCount}
                </div>
                <div className="text-sm text-red-600">Từ chối</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-800">
                  {stats.totalCount}
                </div>
                <div className="text-sm text-blue-600">Tổng cộng</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Đang tải thống kê...</p>
            </div>
          )}
        </div>

        {/* Manager Privileges */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quyền hạn Quản lý
          </h2>
          <div className="space-y-2">
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Duyệt sản phẩm từ seller
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Phân quyền buyer thành seller
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Quản lý user (trừ admin)
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Xem báo cáo và thống kê
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Quản lý chất lượng sản phẩm
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
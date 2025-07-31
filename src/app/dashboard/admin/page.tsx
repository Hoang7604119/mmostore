'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, Users, Settings, Shield, LogOut, ArrowLeft, Package, Tags, CreditCard, BarChart3, AlertTriangle, DollarSign } from 'lucide-react'
import { UserData } from '@/types/user'
import Header from '@/components/Header'

interface User extends UserData {
  credit: number
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
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
            <Shield className="h-8 w-8 text-red-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">
              Bảng Điều Khiển Quản Trị
            </h1>
          </div>
          <p className="text-gray-600">
            Quản lý toàn bộ hệ thống và người dùng
          </p>
        </div>

        {/* Admin Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* User Management */}
          <Link href="/dashboard/admin/users" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Quản Lý User</h3>
                <p className="text-sm text-gray-600">Xem và quản lý tất cả người dùng</p>
              </div>
            </div>
          </Link>

          {/* Product Management */}
          <Link href="/dashboard/admin/products" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Quản Lý Sản Phẩm</h3>
                <p className="text-sm text-gray-600">Toàn quyền quản lý sản phẩm</p>
              </div>
            </div>
          </Link>

          {/* Product Types Management */}
          <Link href="/dashboard/admin/product-types" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Tags className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Quản Lý Loại Sản Phẩm</h3>
                <p className="text-sm text-gray-600">Thêm, sửa, xóa loại sản phẩm</p>
              </div>
            </div>
          </Link>

          {/* Credit Management */}
          <Link href="/admin/credit" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <CreditCard className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Quản Lý Credit</h3>
                <p className="text-sm text-gray-600">Thêm/trừ credit cho users</p>
              </div>
            </div>
          </Link>

          {/* Credit Statistics */}
          <Link href="/dashboard/admin/credit-stats" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-full">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Thống Kê Credit</h3>
                <p className="text-sm text-gray-600">Xem báo cáo tổng hợp credit</p>
              </div>
            </div>
          </Link>

          {/* Payment Management */}
          <Link href="/dashboard/admin/payments" className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer block">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Quản Lý Payments</h3>
                <p className="text-sm text-gray-600">Xem và quản lý thanh toán</p>
              </div>
            </div>
          </Link>

          {/* System Settings */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="bg-gray-100 p-3 rounded-full">
                <Settings className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Cài Đặt Hệ Thống</h3>
                <p className="text-sm text-gray-600">Cấu hình hệ thống</p>
              </div>
            </div>
          </div>

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

          {/* Manager Assignment */}
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900">Phân Quyền Manager</h3>
                <p className="text-sm text-gray-600">Gán/thu hồi quyền quản lý</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Privileges */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quyền hạn Quản trị viên
          </h2>
          <div className="space-y-2">
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              Toàn quyền quản lý hệ thống
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              Gán và thu hồi quyền Manager
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              Xóa bất kỳ user nào trong hệ thống
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              Truy cập tất cả dữ liệu và báo cáo
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              Toàn quyền quản lý sản phẩm của tất cả user
            </p>
            <p className="text-gray-600 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              Cấu hình và bảo trì hệ thống
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart, User, Package, Settings, LogOut, Store } from 'lucide-react'
import { UserData } from '@/types/user'
import Header from '@/components/Header'
import Footer from '@/components/Footer'


interface UserWithCredit extends UserData {
  credit: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          
          // Auto-redirect to role-specific dashboard if coming from homepage
          const shouldAutoRedirect = sessionStorage.getItem('autoRedirectToDashboard')
          if (shouldAutoRedirect) {
            sessionStorage.removeItem('autoRedirectToDashboard')
            switch (data.user.role) {
              case 'admin':
                router.push('/dashboard/admin')
                return
              case 'manager':
                router.push('/dashboard/manager')
                return
              case 'seller':
                router.push('/dashboard/seller')
                return
              case 'buyer':
                router.push('/dashboard/buyer')
                return
            }
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

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị viên'
      case 'manager': return 'Quản lý'
      case 'seller': return 'Người bán'
      case 'buyer': return 'Người mua'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-purple-100 text-purple-800'
      case 'seller': return 'bg-green-100 text-green-800'
      case 'buyer': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Chào mừng đến với Dashboard
          </h1>
          <p className="text-gray-600">
            Quản lý tài khoản và hoạt động của bạn tại đây
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Store */}
          <Link href="/marketplace" className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow touch-manipulation">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Store className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Cửa Hàng</h3>
                <p className="text-xs sm:text-sm text-gray-600">Xem sản phẩm</p>
              </div>
            </div>
          </Link>

          {/* Profile */}
          <Link href={`/dashboard/${user.role}/profile`} className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow touch-manipulation">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Hồ Sơ</h3>
                <p className="text-xs sm:text-sm text-gray-600">Quản lý thông tin</p>
              </div>
            </div>
          </Link>

          {/* Dashboard Buyer - Available for all roles */}
          <Link href="/dashboard/buyer" className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow touch-manipulation">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Dashboard Buyer</h3>
                <p className="text-xs sm:text-sm text-gray-600">Chế độ mua hàng</p>
              </div>
            </div>
          </Link>

          {/* Products (for sellers) */}
          {['seller', 'manager', 'admin'].includes(user.role) && (
            <Link href="/dashboard/seller" className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow touch-manipulation">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Dashboard Seller</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Quản lý bán hàng</p>
                </div>
              </div>
            </Link>
          )}

          {/* Admin Panel */}
          {user.role === 'admin' && (
            <Link href="/dashboard/admin" className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow touch-manipulation">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-full">
                  <Settings className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Quản Trị</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Hệ thống</p>
                </div>
              </div>
            </Link>
          )}

          {/* Manager Panel */}
          {['manager', 'admin'].includes(user.role) && (
            <Link href="/dashboard/manager" className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow touch-manipulation">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Settings className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Quản Lý</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Duyệt sản phẩm</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Role-specific content */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quyền hạn của bạn
          </h2>
          <div className="space-y-2">
            {user.role === 'buyer' && (
              <p className="text-gray-600">• Mua các tài khoản đã được duyệt</p>
            )}
            {user.role === 'seller' && (
              <>
                <p className="text-gray-600">• Đăng bán tài khoản</p>
                <p className="text-gray-600">• Mua các tài khoản đã được duyệt</p>
                <p className="text-gray-600">• Quản lý sản phẩm cá nhân</p>
              </>
            )}
            {user.role === 'manager' && (
              <>
                <p className="text-gray-600">• Duyệt sản phẩm từ seller</p>
                <p className="text-gray-600">• Phân quyền buyer thành seller</p>
                <p className="text-gray-600">• Quản lý user (trừ admin)</p>
              </>
            )}
            {user.role === 'admin' && (
              <>
                <p className="text-gray-600">• Toàn quyền quản lý hệ thống</p>
                <p className="text-gray-600">• Gán/thu hồi quyền manager</p>
                <p className="text-gray-600">• Xóa bất kỳ user nào</p>
              </>
            )}
          </div>
        </div>
        

      </div>
      
      <Footer />
    </div>
  )
}
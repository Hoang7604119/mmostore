'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  CreditCard, 
  Users, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  AlertTriangle,
  Crown
} from 'lucide-react'
import Header from '@/components/Header'
import { UserData } from '@/types/user'

interface UserWithCredit extends UserData {
  credit: number
  createdAt: string
  updatedAt: string
}

interface CreditStatsByRole {
  _id: string
  totalCredit: number
  userCount: number
  avgCredit: number
  maxCredit: number
  minCredit: number
}

interface TotalSystemStats {
  totalCredit: number
  totalUsers: number
  avgCredit: number
}

interface TopUser {
  _id: string
  username: string
  email: string
  role: string
  credit: number
}

interface CreditDistribution {
  _id: number | string
  count: number
  totalCredit: number
}

interface CreditStatsData {
  creditStats: CreditStatsByRole[]
  totalSystemStats: TotalSystemStats
  topCreditUsers: TopUser[]
  lowCreditUsers: TopUser[]
  creditDistribution: CreditDistribution[]
}

export default function AdminCreditStatsPage() {
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [stats, setStats] = useState<CreditStatsData | null>(null)
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
          await fetchCreditStats()
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

  const fetchCreditStats = async () => {
    try {
      const response = await fetch('/api/admin/credit-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Fetch credit stats error:', error)
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
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'manager': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'seller': return 'bg-green-100 text-green-800 border-green-200'
      case 'buyer': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCreditRangeLabel = (boundary: number | string) => {
    if (boundary === 'Other') return 'Khác'
    if (boundary === Infinity) return '10M+ VNĐ'
    const num = Number(boundary)
    if (num === 0) return '0 - 100K VNĐ'
    if (num === 100000) return '100K - 500K VNĐ'
    if (num === 500000) return '500K - 1M VNĐ'
    if (num === 1000000) return '1M - 5M VNĐ'
    if (num === 5000000) return '5M - 10M VNĐ'
    return `${(num / 1000000).toFixed(1)}M VNĐ`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !stats) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link href="/dashboard/admin" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thống kê Credit Hệ thống</h1>
          <p className="text-gray-600">Tổng quan về tình hình credit trong hệ thống marketplace</p>
        </div>

        {/* Tổng quan hệ thống */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng Credit Hệ thống</p>
                <p className="text-2xl font-bold text-green-600">
                  {(stats.totalSystemStats.totalCredit || 0).toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng số Users</p>
                <p className="text-2xl font-bold text-blue-600">
                  {(stats.totalSystemStats.totalUsers || 0).toLocaleString('vi-VN')}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credit Trung bình</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.totalSystemStats.avgCredit || 0).toLocaleString('vi-VN')} VNĐ
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Thống kê theo Role */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Thống kê Credit theo Vai trò
            </h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.creditStats.map((roleStat) => (
                <div key={roleStat._id} className={`p-4 rounded-lg border ${getRoleColor(roleStat._id)}`}>
                  <h3 className="font-semibold mb-2">{getRoleDisplayName(roleStat._id)}</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Tổng credit:</span> {(roleStat.totalCredit || 0).toLocaleString('vi-VN')} VNĐ</p>
                    <p><span className="font-medium">Số users:</span> {roleStat.userCount || 0}</p>
                    <p><span className="font-medium">TB/user:</span> {Math.round(roleStat.avgCredit || 0).toLocaleString('vi-VN')} VNĐ</p>
                    <p><span className="font-medium">Cao nhất:</span> {(roleStat.maxCredit || 0).toLocaleString('vi-VN')} VNĐ</p>
                    <p><span className="font-medium">Thấp nhất:</span> {(roleStat.minCredit || 0).toLocaleString('vi-VN')} VNĐ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phân phối Credit */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Phân phối Credit theo Khoảng
            </h2>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.creditDistribution.map((dist, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {getCreditRangeLabel(dist._id)}
                  </h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Số users:</span> {dist.count || 0}</p>
                    <p><span className="font-medium">Tổng credit:</span> {(dist.totalCredit || 0).toLocaleString('vi-VN')} VNĐ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Top Users có Credit cao */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                Top 10 Users Credit cao nhất
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {stats.topCreditUsers.map((user, index) => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-600">{getRoleDisplayName(user.role)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        {(user.credit || 0).toLocaleString('vi-VN')} VNĐ
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Users có Credit thấp */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Users Credit thấp (cần hỗ trợ)
              </h2>
            </div>
            <div className="p-6">
              {stats.lowCreditUsers.length > 0 ? (
                <div className="space-y-3">
                  {stats.lowCreditUsers.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium text-gray-900">{user.username}</p>
                        <p className="text-sm text-gray-600">{getRoleDisplayName(user.role)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">
                          {(user.credit || 0).toLocaleString('vi-VN')} VNĐ
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Không có users nào có credit thấp</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Thao tác nhanh</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/admin/credit"
              className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <CreditCard className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-blue-800">Quản lý Credit</p>
                <p className="text-sm text-blue-600">Thêm/trừ credit cho users</p>
              </div>
            </Link>

            <button
              onClick={fetchCreditStats}
              className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <TrendingUp className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="font-medium text-green-800">Làm mới dữ liệu</p>
                <p className="text-sm text-green-600">Cập nhật thống kê mới nhất</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
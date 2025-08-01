'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { UserData } from '@/types/user'
import Header from '@/components/Header'
import LoadingSpinner from '@/components/LoadingSpinner'
import { 
  ArrowLeft,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Package
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface PendingCredit {
  _id: string
  userId: string
  amount: number
  reason: string
  status: 'pending' | 'released' | 'cancelled'
  orderId?: {
    _id: string
    orderNumber: string
    totalAmount: number
  }
  createdAt: string
  releaseDate?: string
  releasedAt?: string
  cancelledAt?: string
  adminNote?: string
}

interface Summary {
  pending: { count: number; amount: number }
  released: { count: number; amount: number }
  cancelled: { count: number; amount: number }
}

const getCreditHoldReasonDisplayName = (reason: string): string => {
  const reasonMap: { [key: string]: string } = {
    'order_verification': 'Xác minh đơn hàng',
    'payment_verification': 'Xác minh thanh toán',
    'fraud_prevention': 'Phòng chống gian lận',
    'dispute_resolution': 'Giải quyết tranh chấp',
    'account_review': 'Xem xét tài khoản',
    'compliance_check': 'Kiểm tra tuân thủ',
    'manual_review': 'Xem xét thủ công',
    'system_hold': 'Giam giữ hệ thống',
    'other': 'Khác'
  }
  return reasonMap[reason] || reason
}

const calculateRemainingHoldTime = (releaseDate: Date): number => {
  const now = new Date()
  const release = new Date(releaseDate)
  return Math.max(0, release.getTime() - now.getTime())
}

const formatRemainingTime = (milliseconds: number): string => {
  if (milliseconds <= 0) return 'Đã hết hạn'
  
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days} ngày ${hours % 24} giờ`
  if (hours > 0) return `${hours} giờ ${minutes % 60} phút`
  if (minutes > 0) return `${minutes} phút`
  return `${seconds} giây`
}

export default function PendingCreditsPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const router = useRouter()
  const [pendingCredits, setPendingCredits] = useState<PendingCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<Summary>({
    pending: { count: 0, amount: 0 },
    released: { count: 0, amount: 0 },
    cancelled: { count: 0, amount: 0 }
  })
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'released' | 'cancelled'>('all')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user) {
      fetchPendingCredits()
    }
  }, [user, activeFilter])

  const fetchPendingCredits = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '50'
      })
      
      if (activeFilter !== 'all') {
        params.append('status', activeFilter)
      }
      
      const response = await fetch(`/api/user/pending-credits?${params}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setPendingCredits(data.data.pendingCredits || [])
        setSummary(data.data.summary || {
          pending: { count: 0, amount: 0 },
          released: { count: 0, amount: 0 },
          cancelled: { count: 0, amount: 0 }
        })
      } else {
        console.error('Failed to fetch pending credits:', response.status)
      }
    } catch (error) {
      console.error('Error fetching pending credits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const filteredCredits = activeFilter === 'all' 
    ? pendingCredits 
    : pendingCredits.filter(credit => credit.status === activeFilter)

  const getTimeRemaining = (releaseDate: string) => {
    const remaining = calculateRemainingHoldTime(new Date(releaseDate))
    return formatRemainingTime(remaining)
  }

  if (authLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/50 hover:bg-white hover:shadow-md transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Credit đang giam giữ
            </h1>
            <p className="text-gray-600 mt-1">Quản lý và theo dõi các khoản credit đang bị giam giữ</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Đang chờ giải phóng</p>
                <p className="text-2xl font-bold">{summary.pending.count}</p>
                <p className="text-lg">{summary.pending.amount.toLocaleString('vi-VN')} VNĐ</p>
              </div>
              <Clock className="h-12 w-12 text-yellow-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Đã giải phóng</p>
                <p className="text-2xl font-bold">{summary.released.count}</p>
                <p className="text-lg">{summary.released.amount.toLocaleString('vi-VN')} VNĐ</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Đã hủy</p>
                <p className="text-2xl font-bold">{summary.cancelled.count}</p>
                <p className="text-lg">{summary.cancelled.amount.toLocaleString('vi-VN')} VNĐ</p>
              </div>
              <XCircle className="h-12 w-12 text-red-200" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 mb-6">
          <div className="flex border-b border-gray-200/50">
            {[
              { key: 'all', label: 'Tất cả', count: pendingCredits.length },
              { key: 'pending', label: 'Đang chờ', count: summary.pending.count },
              { key: 'released', label: 'Đã giải phóng', count: summary.released.count },
              { key: 'cancelled', label: 'Đã hủy', count: summary.cancelled.count }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key as any)}
                className={`flex-1 px-6 py-4 text-center font-medium transition-all duration-300 ${
                  activeFilter === filter.key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-gradient-to-r from-blue-50 to-purple-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Credits List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50">
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="sm" fullScreen={false} />
              <p className="text-gray-500 mt-2">Đang tải dữ liệu...</p>
            </div>
          ) : filteredCredits.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Không có credit nào</p>
              <p className="text-sm">Chưa có khoản credit nào trong danh mục này</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCredits.map((credit) => (
                <div key={credit._id} className="p-6 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <span className="text-xl font-bold text-gray-900">
                            {credit.amount.toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>
                        <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                          credit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          credit.status === 'released' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {credit.status === 'pending' ? 'Đang chờ' :
                           credit.status === 'released' ? 'Đã giải phóng' : 'Đã hủy'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Lý do giam giữ</p>
                          <p className="text-gray-900 font-medium">
                            {getCreditHoldReasonDisplayName(credit.reason)}
                          </p>
                        </div>
                        
                        {credit.orderId && (
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Đơn hàng liên quan</p>
                            <p className="text-blue-600 font-medium">
                              #{credit.orderId.orderNumber}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <div>
                            <p className="text-gray-500">Ngày tạo</p>
                            <p className="font-medium">{new Date(credit.createdAt).toLocaleString('vi-VN')}</p>
                          </div>
                        </div>
                        
                        {credit.releaseDate && (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <div>
                              <p className="text-gray-500">Ngày giải phóng dự kiến</p>
                              <p className="font-medium">{new Date(credit.releaseDate).toLocaleString('vi-VN')}</p>
                            </div>
                          </div>
                        )}
                        
                        {credit.status === 'pending' && credit.releaseDate && (
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <div>
                              <p className="text-gray-500">Thời gian còn lại</p>
                              <p className="font-medium text-yellow-600">
                                {getTimeRemaining(credit.releaseDate)}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {credit.releasedAt && (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-gray-500">Đã giải phóng lúc</p>
                              <p className="font-medium text-green-600">{new Date(credit.releasedAt).toLocaleString('vi-VN')}</p>
                            </div>
                          </div>
                        )}
                        
                        {credit.cancelledAt && (
                          <div className="flex items-center space-x-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <div>
                              <p className="text-gray-500">Đã hủy lúc</p>
                              <p className="font-medium text-red-600">{new Date(credit.cancelledAt).toLocaleString('vi-VN')}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {credit.adminNote && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-gray-500 mb-1">Ghi chú từ admin</p>
                          <p className="text-gray-900">{credit.adminNote}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
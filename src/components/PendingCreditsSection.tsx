'use client'

import { useState, useEffect } from 'react'
import LoadingSpinner from './LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  DollarSign,
  FileText,
  RefreshCw,
  TrendingUp,
  Shield,
  Timer,
  Wallet,
  CreditCard,
  Hourglass,
  Sparkles
} from 'lucide-react'
import { 
  getPendingCreditStatusColor, 
  getPendingCreditStatusDisplayName,
  getCreditHoldReasonDisplayName,
  formatRemainingTime,
  calculateRemainingHoldTime,
  PENDING_CREDIT_STATUS
} from '@/constants/credit'

interface PendingCredit {
  _id: string
  amount: number
  reason: string
  status: string
  orderId?: {
    _id: string
    orderNumber: string
    totalAmount: number
  }
  releaseDate: string
  actualReleaseDate?: string
  note?: string
  createdAt: string
  updatedAt: string
}

interface PendingCreditsSectionProps {
  userId: string
  compact?: boolean
}

export default function PendingCreditsSection({ userId, compact = false }: PendingCreditsSectionProps) {
  const [pendingCredits, setPendingCredits] = useState<PendingCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    pending: { amount: 0, count: 0 },
    released: { amount: 0, count: 0 },
    cancelled: { amount: 0, count: 0 }
  })
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const fetchPendingCredits = async (status?: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '20'
      })
      
      if (status && status !== 'all') {
        params.append('status', status)
      }
      
      const response = await fetch(`/api/user/pending-credits?${params}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setPendingCredits(data.data.pendingCredits)
        setSummary(data.data.summary)
      } else {
        console.error('Failed to fetch pending credits')
      }
    } catch (error) {
      console.error('Error fetching pending credits:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingCredits(activeFilter)
  }, [activeFilter])

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
  }

  const getStatusIcon = (status: string, className: string = "h-4 w-4") => {
    const iconClass = className.includes('text-') ? className : `${className} text-white`
    
    switch (status) {
      case 'pending':
      case PENDING_CREDIT_STATUS.PENDING:
        return <Clock className={iconClass} />
      case 'released':
      case PENDING_CREDIT_STATUS.RELEASED:
        return <CheckCircle className={iconClass} />
      case 'cancelled':
      case PENDING_CREDIT_STATUS.CANCELLED:
        return <XCircle className={iconClass} />
      default:
        return <AlertCircle className={iconClass} />
    }
  }

  const getRemainingTimeDisplay = (releaseDate: string, status: string) => {
    if (status !== PENDING_CREDIT_STATUS.PENDING) return null
    
    const remaining = calculateRemainingHoldTime(new Date(releaseDate))
    const timeText = formatRemainingTime(remaining)
    
    return (
      <div className="flex items-center space-x-1 text-sm">
        <Clock className="h-3 w-3" />
        <span className={remaining === 0 ? 'text-green-600 font-medium' : 'text-orange-600'}>
          {timeText}
        </span>
      </div>
    )
  }

  const getTimeRemaining = (releaseDate: string) => {
    const remaining = calculateRemainingHoldTime(new Date(releaseDate))
    return formatRemainingTime(remaining)
  }

  const filteredCredits = activeFilter === 'all' 
    ? pendingCredits 
    : pendingCredits.filter(credit => credit.status === activeFilter)

  if (loading) {
    if (compact) {
      return (
        <div className="bg-gradient-to-r from-yellow-50/50 to-orange-50/50 border border-yellow-200/50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-sm text-gray-600">Đang tải...</span>
          </div>
        </div>
      )
    }
    
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 animate-pulse"></div>
        <div className="relative flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-600 animate-pulse" />
          </div>
          <div className="mt-6 text-center">
            <p className="text-lg font-semibold text-gray-700 mb-2">Đang tải dữ liệu</p>
            <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát...</p>
          </div>
        </div>
      </div>
    )
  }

  // Compact version for integration into transaction history
  if (compact) {
    return (
      <div className="bg-gradient-to-r from-yellow-50/50 to-orange-50/50 border border-yellow-200/50 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
            <Clock className="h-4 w-4 mr-2 text-yellow-600" />
            Credit đang giam giữ
          </h4>
          <span className="text-sm font-medium text-yellow-600">
            {summary.pending.amount.toLocaleString('vi-VN')} VNĐ
          </span>
        </div>
        
        {filteredCredits.filter(c => c.status === 'pending').length > 0 && (
          <div className="space-y-2">
            {filteredCredits.filter(c => c.status === 'pending').slice(0, 2).map((credit) => (
              <div key={credit._id} className="flex items-center justify-between text-xs bg-white/50 rounded-lg p-2">
                <div>
                  <span className="font-medium">{credit.amount.toLocaleString('vi-VN')} VNĐ</span>
                  <span className="text-gray-500 ml-2">{getCreditHoldReasonDisplayName(credit.reason)}</span>
                </div>
                {credit.releaseDate && (
                  <span className="text-yellow-600">
                    {getTimeRemaining(credit.releaseDate)}
                  </span>
                )}
              </div>
            ))}
            {filteredCredits.filter(c => c.status === 'pending').length > 2 && (
              <p className="text-xs text-gray-500 text-center">
                +{filteredCredits.filter(c => c.status === 'pending').length - 2} khoản khác
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-400/10 to-transparent rounded-full translate-y-24 -translate-x-24"></div>
      
      {/* Header */}
      <div className="relative p-8 border-b border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Credit đang giam giữ
              </h3>
              <p className="text-sm text-gray-600 mt-1">Quản lý và theo dõi credit của bạn</p>
            </div>
          </div>
          <button
            onClick={() => fetchPendingCredits(activeFilter)}
            className="group p-3 bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-white/30 hover:border-blue-300 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-105"
            title="Làm mới"
          >
            <RefreshCw className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="group relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-orange-400/5"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Timer className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-700">Đang chờ</p>
                </div>
                <p className="text-2xl font-bold text-amber-800">
                  {summary.pending.amount.toLocaleString('vi-VN')}
                </p>
                <p className="text-xs text-amber-600 mt-1">VNĐ</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-green-400/5"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-700">Đã giải phóng</p>
                </div>
                <p className="text-2xl font-bold text-emerald-800">
                  {summary.released.amount.toLocaleString('vi-VN')}
                </p>
                <p className="text-xs text-emerald-600 mt-1">VNĐ</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200/50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-400/5 to-red-400/5"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                  <p className="text-sm font-medium text-rose-700">Đã hủy</p>
                </div>
                <p className="text-2xl font-bold text-rose-800">
                  {summary.cancelled.amount.toLocaleString('vi-VN')}
                </p>
                <p className="text-xs text-rose-600 mt-1">VNĐ</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-rose-400 to-red-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <XCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { key: 'all', label: 'Tất cả', count: summary.pending.count + summary.released.count + summary.cancelled.count, color: 'blue' },
            { key: 'pending', label: 'Đang chờ', count: summary.pending.count, color: 'amber' },
            { key: 'released', label: 'Đã giải phóng', count: summary.released.count, color: 'emerald' },
            { key: 'cancelled', label: 'Đã hủy', count: summary.cancelled.count, color: 'rose' }
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`group relative overflow-hidden px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                activeFilter === filter.key
                  ? `bg-gradient-to-r ${
                      filter.color === 'blue' ? 'from-blue-500 to-indigo-600' :
                      filter.color === 'amber' ? 'from-amber-500 to-orange-600' :
                      filter.color === 'emerald' ? 'from-emerald-500 to-green-600' :
                      'from-rose-500 to-red-600'
                    } text-white shadow-lg`
                  : 'bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200/50 hover:shadow-md'
              }`}
            >
              <div className="relative z-10 flex items-center space-x-2">
                <span>{filter.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeFilter === filter.key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {filter.count}
                </span>
              </div>
              {activeFilter === filter.key && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50"></div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {pendingCredits.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
              <DollarSign className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium mb-2">Không có credit nào đang bị giam giữ</p>
            <p className="text-gray-400 text-sm">Các giao dịch credit sẽ hiển thị tại đây</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingCredits.map((credit, index) => (
              <div
                key={credit._id}
                className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="relative">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`relative p-3 rounded-2xl shadow-lg transform group-hover:scale-110 transition-transform duration-300 ${
                        credit.status === PENDING_CREDIT_STATUS.PENDING ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                        credit.status === PENDING_CREDIT_STATUS.RELEASED ? 'bg-gradient-to-br from-emerald-400 to-green-500' :
                        'bg-gradient-to-br from-rose-400 to-red-500'
                      }`}>
                        <div className="text-white">
                          {getStatusIcon(credit.status)}
                        </div>
                        <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            {credit.amount.toLocaleString('vi-VN')}
                          </span>
                          <span className="text-lg font-medium text-gray-500">VNĐ</span>
                        </div>
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${getPendingCreditStatusColor(credit.status)}`}>
                          <span>{getPendingCreditStatusDisplayName(credit.status)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Info Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl border border-blue-100/50">
                        <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg shadow-sm">
                          <AlertCircle className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Lý do giam giữ</p>
                          <p className="text-sm font-medium text-gray-900">{getCreditHoldReasonDisplayName(credit.reason)}</p>
                        </div>
                      </div>
                      
                      {credit.orderId && (
                        <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-xl border border-purple-100/50">
                          <div className="p-2 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg shadow-sm">
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Đơn hàng liên quan</p>
                            <p className="text-sm font-medium text-gray-900">#{credit.orderId.orderNumber}</p>
                            <p className="text-xs text-gray-500 mt-1">{credit.orderId.totalAmount?.toLocaleString('vi-VN')} VNĐ</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-emerald-50/80 to-green-50/80 rounded-xl border border-emerald-100/50">
                        <div className="p-2 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg shadow-sm">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Ngày tạo</p>
                          <p className="text-sm font-medium text-gray-900">{new Date(credit.createdAt).toLocaleDateString('vi-VN')}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(credit.createdAt).toLocaleTimeString('vi-VN')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-orange-50/80 to-red-50/80 rounded-xl border border-orange-100/50">
                        <div className="p-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg shadow-sm">
                          <Hourglass className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Ngày giải phóng</p>
                          <p className="text-sm font-medium text-gray-900">{new Date(credit.releaseDate).toLocaleDateString('vi-VN')}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(credit.releaseDate).toLocaleTimeString('vi-VN')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Countdown Timer */}
                  {credit.status === PENDING_CREDIT_STATUS.PENDING && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-200/30 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                            <Timer className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-700 mb-1">Thời gian còn lại</p>
                            {getRemainingTimeDisplay(credit.releaseDate, credit.status)}
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                          <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Notes Section */}
                  {credit.note && (
                    <div className="p-4 bg-gradient-to-r from-gray-50/80 to-blue-50/80 border border-gray-200/50 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg shadow-sm">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Ghi chú từ hệ thống</p>
                          <p className="text-sm text-gray-700 leading-relaxed">{credit.note}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
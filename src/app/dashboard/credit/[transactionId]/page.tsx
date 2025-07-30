'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Header from '@/components/Header'
import { 
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  User,
  Hash
} from 'lucide-react'

interface TransactionDetail {
  id: string
  orderCode: number
  amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'failed'
  paymentMethod: string
  description: string
  transactionId?: string
  createdAt: string
  updatedAt: string
}

export default function TransactionDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const transactionId = params.transactionId as string

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null)
  const [loadingTransaction, setLoadingTransaction] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchTransactionDetail = async () => {
      if (!transactionId) return
      
      try {
        setLoadingTransaction(true)
        const response = await fetch(`/api/payment/detail/${transactionId}`, {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          setTransaction(data.data)
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Không thể tải thông tin giao dịch')
        }
      } catch (error) {
        console.error('Error fetching transaction detail:', error)
        setError('Lỗi kết nối')
      } finally {
        setLoadingTransaction(false)
      }
    }

    fetchTransactionDetail()
  }, [transactionId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-6 w-6 text-green-600" />
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-600" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-6 w-6 text-red-600" />
      default:
        return <Clock className="h-6 w-6 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Hoàn thành'
      case 'pending':
        return 'Đang xử lý'
      case 'failed':
        return 'Thất bại'
      case 'cancelled':
        return 'Đã hủy'
      default:
        return 'Không xác định'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'failed':
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading || loadingTransaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lỗi tải dữ liệu</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy giao dịch</h2>
            <p className="text-gray-600 mb-4">Giao dịch không tồn tại hoặc bạn không có quyền truy cập</p>
            <button
              onClick={() => router.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Quay lại
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết giao dịch</h1>
        </div>

        {/* Transaction Overview */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Nạp tiền</h2>
                  <p className="text-gray-600">Mã giao dịch: #{transaction.orderCode}</p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full border ${getStatusColor(transaction.status)}`}>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(transaction.status)}
                  <span className="font-medium">{getStatusText(transaction.status)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Số tiền</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {transaction.amount.toLocaleString('vi-VN')} VNĐ
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phương thức thanh toán</p>
                    <p className="text-lg font-medium text-gray-900">
                      {transaction.paymentMethod === 'payos' ? 'PayOS' : transaction.paymentMethod}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Ngày tạo</p>
                    <p className="text-lg font-medium text-gray-900">
                      {new Date(transaction.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                
                {transaction.transactionId && (
                  <div className="flex items-center space-x-3">
                    <Hash className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Mã giao dịch PayOS</p>
                      <p className="text-lg font-medium text-gray-900 font-mono">
                        {transaction.transactionId}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin chi tiết</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả giao dịch</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-900">{transaction.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-900 font-mono">{transaction.orderCode}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(transaction.status)}
                      <span className="text-gray-900 font-medium">{getStatusText(transaction.status)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày cập nhật</label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-900">
                      {new Date(transaction.updatedAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID giao dịch</label>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-900 font-mono text-sm">{transaction.id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={() => router.push('/dashboard/credit')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Về trang Credit
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            In giao dịch
          </button>
        </div>
      </div>
    </div>
  )
}
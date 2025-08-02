'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle, FileText, DollarSign, User, Package } from 'lucide-react'
import Header from '@/components/Header'


interface Report {
  _id: string
  reportType: string
  title: string
  description: string
  status: 'pending' | 'investigating' | 'resolved' | 'rejected'
  refundAmount?: number
  refundProcessed: boolean
  adminNote?: string
  createdAt: string
  resolvedAt?: string
  productId: {
    _id: string
    title: string
    type: string
    category: string
    price: number
  }
  sellerId: {
    _id: string
    username: string
    email: string
  }
  accountItemId: {
    _id: string
    username?: string
    email?: string
  }
  buyerId: {
    _id: string
    username: string
    email: string
  }
}

const REPORT_TYPE_LABELS = {
    account_invalid: 'Tài khoản không hợp lệ',
    account_banned: 'Tài khoản bị khóa',
    wrong_info: 'Thông tin sai',
    fraud: 'Lừa đảo',
    other: 'Khác'
  }

const STATUS_LABELS = {
  pending: 'Chờ xử lý',
  investigating: 'Đang điều tra',
  resolved: 'Đã giải quyết',
  rejected: 'Bị từ chối'
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  investigating: 'bg-blue-100 text-blue-800 border-blue-200',
  resolved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200'
}

const STATUS_ICONS = {
  pending: Clock,
  investigating: AlertTriangle,
  resolved: CheckCircle,
  rejected: XCircle
}

export default function ReportDetailPage() {
  const [user, setUser] = useState<any>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const reportId = params.reportId as string

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (!['buyer'].includes(data.user.role)) {
            router.push('/dashboard')
            return
          }
          setUser(data.user)
          fetchReport()
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
  }, [router, reportId])

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError('Không tìm thấy báo cáo')
        } else if (response.status === 403) {
          setError('Bạn không có quyền xem báo cáo này')
        } else {
          setError('Có lỗi xảy ra khi tải báo cáo')
        }
        return
      }

      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error('Error fetching report:', error)
      setError('Có lỗi xảy ra khi tải báo cáo')
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
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-xl border border-blue-100/50 p-8 backdrop-blur-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-lg w-1/4 mb-4 shadow-sm"></div>
              <div className="h-8 bg-gradient-to-r from-purple-200 to-pink-200 rounded-xl w-1/2 mb-6 shadow-sm"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gradient-to-r from-gray-200 to-blue-200 rounded-lg shadow-sm"></div>
                <div className="h-4 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg w-5/6 shadow-sm"></div>
                <div className="h-4 bg-gradient-to-r from-orange-200 to-red-200 rounded-lg w-4/6 shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => router.push('/dashboard/buyer/reports')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Quay lại danh sách báo cáo
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy báo cáo</h3>
              <p className="text-gray-600 mb-4">Báo cáo bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
              <button
                onClick={() => router.push('/dashboard/buyer/reports')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Quay lại danh sách báo cáo
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const StatusIcon = STATUS_ICONS[report.status]

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/buyer/reports')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách báo cáo
        </button>

        {/* Report Header */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{report.title}</h1>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[report.status]}`}>
                  <StatusIcon className="h-4 w-4 mr-2" />
                  {STATUS_LABELS[report.status]}
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div>Báo cáo #{report._id.slice(-8)}</div>
                <div>Tạo lúc: {formatDate(report.createdAt)}</div>
                {report.resolvedAt && (
                  <div>Giải quyết lúc: {formatDate(report.resolvedAt)}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Report Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Report Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Thông tin báo cáo
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại báo cáo</label>
                  <p className="text-gray-900">{REPORT_TYPE_LABELS[report.reportType as keyof typeof REPORT_TYPE_LABELS] || report.reportType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{report.description}</p>
                </div>
                {report.refundAmount && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền hoàn trả</label>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-green-600 font-semibold">{formatCurrency(report.refundAmount)}</span>
                      {report.refundProcessed && (
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Đã xử lý</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Thông tin sản phẩm
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
                  <p className="text-gray-900">{report.productId.title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                  <p className="text-gray-900">{report.productId.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <p className="text-gray-900">{report.productId.category}</p>
                </div>
                {report.productId.price && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá</label>
                    <p className="text-gray-900">{formatCurrency(report.productId.price)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seller and Account Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Seller Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Thông tin người bán
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên người dùng</label>
                  <p className="text-gray-900">{report.sellerId.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{report.sellerId.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Item Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Thông tin tài khoản được báo cáo
              </h2>
              <div className="space-y-4">
                {report.accountItemId.username && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên tài khoản</label>
                    <p className="text-gray-900">{report.accountItemId.username}</p>
                  </div>
                )}
                {report.accountItemId.email && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email tài khoản</label>
                    <p className="text-gray-900">{report.accountItemId.email}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Response */}
        {report.adminNote && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Phản hồi từ quản trị viên</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-900 whitespace-pre-wrap">{report.adminNote}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
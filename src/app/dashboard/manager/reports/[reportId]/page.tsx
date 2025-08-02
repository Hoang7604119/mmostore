'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertTriangle, FileText, DollarSign, User, Package, Save, MessageSquare } from 'lucide-react'
import Header from '@/components/Header'
interface User {
  _id: string
  username: string
  email: string
  role: 'admin' | 'manager' | 'seller' | 'buyer'
  credit: number
  isActive: boolean
}

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

export default function ManagerReportDetailPage() {
  const [user, setUser] = useState<User | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [newStatus, setNewStatus] = useState<string>('')
  const [adminNote, setAdminNote] = useState('')
  const [refundAmount, setRefundAmount] = useState<string>('')
  const [refundProcessed, setRefundProcessed] = useState(false)
  const router = useRouter()
  const params = useParams()
  const reportId = params.reportId as string

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        
        if (!response.ok) {
          router.push('/login')
          return
        }
        
        const userData = await response.json()
        
        if (userData.role !== 'manager') {
          router.push('/dashboard')
          return
        }
        
        setUser(userData)
        fetchReport()
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [reportId])

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError('Không tìm thấy báo cáo')
        } else {
          setError('Có lỗi xảy ra khi tải báo cáo')
        }
        return
      }

      const data = await response.json()
      setReport(data)
      setNewStatus(data.status)
      setAdminNote(data.adminNote || '')
      setRefundAmount(data.refundAmount ? data.refundAmount.toString() : '')
      setRefundProcessed(data.refundProcessed || false)
    } catch (error) {
      console.error('Error fetching report:', error)
      setError('Có lỗi xảy ra khi tải báo cáo')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      router.push('/')
    }
  }

  const updateReport = async () => {
    if (!report) return

    try {
      setUpdating(true)
      
      const updateData: any = {
        status: newStatus,
        adminNote: adminNote.trim()
      }

      // Only include refund data if amount is provided
      if (refundAmount && parseFloat(refundAmount) > 0) {
        updateData.refundAmount = parseFloat(refundAmount)
        updateData.refundProcessed = refundProcessed
      }

      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        throw new Error('Failed to update report')
      }

      const updatedReport = await response.json()
      setReport(updatedReport)
      
      // Show success message
      alert('Báo cáo đã được cập nhật thành công!')
    } catch (error) {
      console.error('Error updating report:', error)
      alert('Có lỗi xảy ra khi cập nhật báo cáo')
    } finally {
      setUpdating(false)
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

  if (!user || user.role !== 'manager') {
    return null
  }

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
        <div className="max-w-6xl mx-auto px-4 py-8">
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

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={handleLogout} />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
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
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => router.push('/dashboard/manager/reports')}
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
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy báo cáo</h3>
              <p className="text-gray-600 mb-4">Báo cáo bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
              <button
                onClick={() => router.push('/dashboard/manager/reports')}
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/dashboard/manager/reports')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách báo cáo
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Details - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Report Header */}
            <div className="bg-white rounded-lg shadow">
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
                    <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{report.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product and Users Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Information */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Sản phẩm
                  </h2>
                  <div className="space-y-3">
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

              {/* Users Information */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Thông tin người dùng
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Người báo cáo</label>
                      <p className="text-gray-900">{report.buyerId.username}</p>
                      <p className="text-sm text-gray-600">{report.buyerId.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Người bán</label>
                      <p className="text-gray-900">{report.sellerId.username}</p>
                      <p className="text-sm text-gray-600">{report.sellerId.email}</p>
                    </div>
                    {(report.accountItemId.username || report.accountItemId.email) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản được báo cáo</label>
                        {report.accountItemId.username && (
                          <p className="text-gray-900">{report.accountItemId.username}</p>
                        )}
                        {report.accountItemId.email && (
                          <p className="text-sm text-gray-600">{report.accountItemId.email}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Management Panel - Right Column */}
          <div className="space-y-6">
            {/* Status Management */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Xử lý báo cáo</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pending">Chờ xử lý</option>
                      <option value="investigating">Đang điều tra</option>
                      <option value="resolved">Đã giải quyết</option>
                      <option value="rejected">Bị từ chối</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú quản trị</label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={4}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập ghi chú về việc xử lý báo cáo..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số tiền hoàn trả (VND)</label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  {refundAmount && parseFloat(refundAmount) > 0 && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="refundProcessed"
                        checked={refundProcessed}
                        onChange={(e) => setRefundProcessed(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="refundProcessed" className="ml-2 block text-sm text-gray-700">
                        Đã xử lý hoàn tiền
                      </label>
                    </div>
                  )}

                  <button
                    onClick={updateReport}
                    disabled={updating}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {updating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {updating ? 'Đang cập nhật...' : 'Cập nhật báo cáo'}
                  </button>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái hiện tại</h2>
                <div className="space-y-3">
                  {report.refundAmount && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">Hoàn tiền</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-800">
                          {formatCurrency(report.refundAmount)}
                        </div>
                        <div className="text-xs text-green-600">
                          {report.refundProcessed ? 'Đã xử lý' : 'Chưa xử lý'}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {report.adminNote && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <MessageSquare className="h-4 w-4 text-gray-600 mr-2" />
                        <span className="text-sm font-medium text-gray-700">Ghi chú hiện tại</span>
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{report.adminNote}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
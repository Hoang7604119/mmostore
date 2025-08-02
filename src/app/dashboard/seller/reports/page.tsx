'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, AlertTriangle, CheckCircle, XCircle, Clock, Search, Filter, Eye, DollarSign, User, Package } from 'lucide-react'
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
  }
  buyerId: {
    _id: string
    username: string
    email: string
  }
  accountItemId: {
    _id: string
    username?: string
    email?: string
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

export default function SellerReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (!['admin', 'manager', 'seller'].includes(data.user.role)) {
            router.push('/dashboard')
            return
          }
          setUser(data.user)
          fetchReports()
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

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/seller/reports', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      const data = await response.json()
      setReports(data.reports)
    } catch (error) {
      console.error('Error fetching reports:', error)
      setError('Có lỗi xảy ra khi tải danh sách báo cáo')
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

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.buyerId.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.productId.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    const matchesType = typeFilter === 'all' || report.reportType === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const handleViewReport = (reportId: string) => {
    router.push(`/dashboard/seller/reports/${reportId}`)
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

  const getStatusStats = () => {
    const stats = {
      total: reports.length,
      pending: reports.filter(r => r.status === 'pending').length,
      investigating: reports.filter(r => r.status === 'investigating').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
      rejected: reports.filter(r => r.status === 'rejected').length
    }
    return stats
  }

  if (!user || user.role !== 'seller') {
    return null
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
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Có lỗi xảy ra</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchReports}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const stats = getStatusStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Báo cáo về sản phẩm của tôi</h1>
          <p className="text-gray-600">Xem và theo dõi các báo cáo từ khách hàng về sản phẩm của bạn</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tổng báo cáo</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Chờ xử lý</p>
                <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Đang điều tra</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.investigating}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Đã giải quyết</p>
                <p className="text-2xl font-semibold text-green-600">{stats.resolved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Bị từ chối</p>
                <p className="text-2xl font-semibold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm báo cáo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="investigating">Đang điều tra</option>
                  <option value="resolved">Đã giải quyết</option>
                  <option value="rejected">Bị từ chối</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả loại báo cáo</option>
                  <option value="account_invalid">Tài khoản không hợp lệ</option>
                <option value="account_banned">Tài khoản bị khóa</option>
                <option value="wrong_info">Thông tin sai</option>
                <option value="fraud">Lừa đảo</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Danh sách báo cáo ({filteredReports.length})</h2>
            
            {filteredReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có báo cáo nào</h3>
                <p className="text-gray-600">
                  {reports.length === 0 
                    ? 'Chưa có báo cáo nào về sản phẩm của bạn.' 
                    : 'Không tìm thấy báo cáo nào phù hợp với bộ lọc hiện tại.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredReports.map((report) => {
                  const StatusIcon = STATUS_ICONS[report.status]
                  return (
                    <div key={report._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[report.status]}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {STATUS_LABELS[report.status]}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center text-sm text-gray-600">
                              <Package className="h-4 w-4 mr-2" />
                              <span>{report.productId.title}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <User className="h-4 w-4 mr-2" />
                              <span>Báo cáo bởi: {report.buyerId.username}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <FileText className="h-4 w-4 mr-2" />
                              <span>{REPORT_TYPE_LABELS[report.reportType as keyof typeof REPORT_TYPE_LABELS]}</span>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-4 line-clamp-2">{report.description}</p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Tạo lúc: {formatDate(report.createdAt)}</span>
                              {report.resolvedAt && (
                                <span>Giải quyết lúc: {formatDate(report.resolvedAt)}</span>
                              )}
                              {report.refundAmount && (
                                <div className="flex items-center text-red-600">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  <span>Hoàn tiền: {formatCurrency(report.refundAmount)}</span>
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => handleViewReport(report._id)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
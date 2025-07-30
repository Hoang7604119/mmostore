'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft, Clock, CheckCircle, XCircle, Eye, FileText, DollarSign, Search, Filter } from 'lucide-react'
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
  }
  sellerId: {
    _id: string
    username: string
    email: string
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
  fake_account: 'Tài khoản giả mạo',
  wrong_info: 'Thông tin sai',
  not_working: 'Tài khoản không hoạt động',
  scam: 'Lừa đảo',
  other: 'Khác'
}

const STATUS_LABELS = {
  pending: 'Chờ xử lý',
  investigating: 'Đang điều tra',
  resolved: 'Đã giải quyết',
  rejected: 'Bị từ chối'
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  investigating: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
}

const STATUS_ICONS = {
  pending: Clock,
  investigating: AlertTriangle,
  resolved: CheckCircle,
  rejected: XCircle
}

export default function ManagerReportsPage() {
  const [user, setUser] = useState<User | null>(null)
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
        fetchReports()
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/reports', {
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

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.buyerId.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.sellerId.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.productId.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    const matchesType = typeFilter === 'all' || report.reportType === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
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
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý báo cáo</h1>
          <p className="text-gray-600">Xem và quản lý tất cả báo cáo từ người mua</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng số</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chờ xử lý</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đang điều tra</p>
                <p className="text-2xl font-bold text-blue-600">{stats.investigating}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đã giải quyết</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bị từ chối</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo tiêu đề, mô tả, người dùng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="investigating">Đang điều tra</option>
                  <option value="resolved">Đã giải quyết</option>
                  <option value="rejected">Bị từ chối</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loại báo cáo</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="fake_account">Tài khoản giả mạo</option>
                  <option value="wrong_info">Thông tin sai</option>
                  <option value="not_working">Tài khoản không hoạt động</option>
                  <option value="scam">Lừa đảo</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Danh sách báo cáo ({filteredReports.length})
            </h2>
            
            {filteredReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có báo cáo nào</h3>
                <p className="text-gray-600">
                  {reports.length === 0 
                    ? 'Chưa có báo cáo nào được tạo.'
                    : 'Không tìm thấy báo cáo nào phù hợp với bộ lọc hiện tại.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Báo cáo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Người báo cáo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sản phẩm
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReports.map((report) => {
                      const StatusIcon = STATUS_ICONS[report.status]
                      return (
                        <tr key={report._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{report.title}</div>
                              <div className="text-sm text-gray-500">
                                {REPORT_TYPE_LABELS[report.reportType as keyof typeof REPORT_TYPE_LABELS] || report.reportType}
                              </div>
                              {report.refundAmount && (
                                <div className="text-sm text-green-600 flex items-center mt-1">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {formatCurrency(report.refundAmount)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{report.buyerId.username}</div>
                            <div className="text-sm text-gray-500">{report.buyerId.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{report.productId.title}</div>
                            <div className="text-sm text-gray-500">{report.productId.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[report.status]}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {STATUS_LABELS[report.status]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(report.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => router.push(`/dashboard/manager/reports/${report._id}`)}
                              className="text-blue-600 hover:text-blue-900 flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
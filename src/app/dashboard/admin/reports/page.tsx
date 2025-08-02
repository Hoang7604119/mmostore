'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, ArrowLeft, AlertTriangle, Eye, Check, X, DollarSign, Ban, Clock, Filter } from 'lucide-react'
import Header from '@/components/Header'

interface Report {
  _id: string
  reporterId: {
    _id: string
    username: string
    email: string
  } | null
  productId: {
    _id: string
    title: string
    type: string
    category: string
    pricePerUnit: number
  } | null
  accountItemId: {
    _id: string
    username: string
    password: string
    email?: string
  } | null
  sellerId: {
    _id: string
    username: string
    email: string
  } | null
  reportType: string
  title: string
  description: string
  evidence?: string
  status: 'pending' | 'investigating' | 'resolved' | 'rejected'
  adminNote?: string
  refundAmount?: number
  refundProcessed: boolean
  sellerPenalty?: {
    type: 'warning' | 'credit_deduction' | 'temporary_ban' | 'permanent_ban'
    amount?: number
    duration?: number
    reason: string
  }
  createdAt: string
  resolvedAt?: string
  resolvedBy?: {
    _id: string
    username: string
  }
}

interface UserWithCredit {
  _id: string
  username: string
  email: string
  role: 'admin' | 'manager' | 'seller' | 'buyer'
  credit: number
  isActive: boolean
}

interface ReportStats {
  total: number
  pending: number
  investigating: number
  resolved: number
  rejected: number
}

export default function AdminReportsPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [resolveData, setResolveData] = useState({
    status: 'resolved' as 'resolved' | 'rejected',
    adminNote: '',
    refundAmount: 0,
    sellerPenalty: {
      type: 'warning' as 'warning' | 'credit_deduction' | 'temporary_ban' | 'permanent_ban',
      amount: 0,
      duration: 0,
      reason: ''
    }
  })
  const [submittingResolve, setSubmittingResolve] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    reportType: 'all'
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const initializeData = async () => {
      await checkAuth()
      await fetchReports()
    }
    
    initializeData()
  }, [currentPage, filters])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.user.role !== 'admin' && data.user.role !== 'manager') {
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
    }
  }

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.reportType !== 'all' && { reportType: filters.reportType })
      })
      
      const response = await fetch(`/api/admin/reports?${params}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
        setStats({...data.stats, total: data.pagination.total})
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveReport = async () => {
    if (!selectedReport) return
    
    setSubmittingResolve(true)
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          reportId: selectedReport._id,
          status: resolveData.status,
          adminNote: resolveData.adminNote,
          refundAmount: resolveData.status === 'resolved' ? resolveData.refundAmount : 0,
          processRefund: resolveData.status === 'resolved' && resolveData.refundAmount > 0,
          sellerPenalty: resolveData.status === 'resolved' ? resolveData.sellerPenalty : null
        })
      })
      
      if (response.ok) {
        alert('Báo cáo đã được xử lý thành công!')
        setShowResolveModal(false)
        setSelectedReport(null)
        await fetchReports()
      } else {
        const error = await response.json()
        alert(error.message || 'Có lỗi xảy ra khi xử lý báo cáo')
      }
    } catch (error) {
      console.error('Error resolving report:', error)
      alert('Có lỗi xảy ra khi xử lý báo cáo')
    } finally {
      setSubmittingResolve(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Chờ xử lý' },
      investigating: { color: 'bg-blue-100 text-blue-800', text: 'Đang điều tra' },
      resolved: { color: 'bg-green-100 text-green-800', text: 'Đã giải quyết' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Đã từ chối' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    )
  }

  const getReportTypeText = (type: string) => {
    const types = {
      account_invalid: 'Tài khoản không hợp lệ',
      account_banned: 'Tài khoản bị khóa',
      wrong_info: 'Thông tin sai',
      fraud: 'Lừa đảo',
      other: 'Khác'
    }
    return types[type as keyof typeof types] || type
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={() => {}} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <AlertTriangle className="h-8 w-8 mr-3 text-red-600" />
                Quản lý báo cáo
              </h1>
              <p className="mt-2 text-gray-600">Xem và xử lý các báo cáo từ người mua</p>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại Dashboard
            </Link>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng số</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chờ xử lý</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đang điều tra</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.investigating}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đã giải quyết</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <X className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Đã từ chối</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setFilters({...filters, status: e.target.value})
                    setCurrentPage(1)
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">Tất cả</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="investigating">Đang điều tra</option>
                  <option value="resolved">Đã giải quyết</option>
                  <option value="rejected">Đã từ chối</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại báo cáo
                </label>
                <select
                  value={filters.reportType}
                  onChange={(e) => {
                    setFilters({...filters, reportType: e.target.value})
                    setCurrentPage(1)
                  }}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">Tất cả</option>
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Báo cáo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người báo cáo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người bán
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
                {reports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{report.title}</div>
                        <div className="text-sm text-gray-500">{getReportTypeText(report.reportType)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.productId ? report.productId.title : 'Sản phẩm đã bị xóa'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.productId ? `${report.productId.type} - ${report.productId.category}` : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.reporterId ? report.reporterId.username : 'Người dùng đã bị xóa'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.reporterId ? report.reporterId.email : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {report.sellerId ? report.sellerId.username : 'Người bán đã bị xóa'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {report.sellerId ? report.sellerId.email : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {(report.status === 'pending' || report.status === 'investigating') && (
                        <button
                          onClick={() => {
                            setSelectedReport(report)
                            setShowResolveModal(true)
                            setResolveData({
                              status: 'resolved',
                              adminNote: '',
                              refundAmount: report.productId ? report.productId.pricePerUnit : 0,
                              sellerPenalty: {
                                type: 'warning',
                                amount: 0,
                                duration: 0,
                                reason: ''
                              }
                            })
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Trước
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border rounded-md text-sm font-medium ${
                    currentPage === page
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      {selectedReport && !showResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Chi tiết báo cáo</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loại báo cáo</label>
                    <p className="mt-1 text-sm text-gray-900">{getReportTypeText(selectedReport.reportType)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                    <div className="mt-1">{getStatusBadge(selectedReport.status)}</div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedReport.title}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
                
                {selectedReport.evidence && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bằng chứng</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedReport.evidence}</p>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Thông tin sản phẩm</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedReport.productId ? selectedReport.productId.title : 'Sản phẩm đã bị xóa'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Giá</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedReport.productId ? new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(selectedReport.productId.pricePerUnit) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Thông tin tài khoản được báo cáo</h4>
                  {selectedReport.accountItemId ? (
                    <div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Username</label>
                          <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                            {selectedReport.accountItemId.username}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Password</label>
                          <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                            {selectedReport.accountItemId.password}
                          </p>
                        </div>
                      </div>
                      {selectedReport.accountItemId.email && (
                        <div className="mt-2">
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                            {selectedReport.accountItemId.email}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Thông tin tài khoản không khả dụng</p>
                  )}
                </div>
                
                {selectedReport.adminNote && (
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700">Ghi chú của admin</label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedReport.adminNote}</p>
                  </div>
                )}
                
                {selectedReport.resolvedAt && (
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Ngày giải quyết</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedReport.resolvedAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      {selectedReport.resolvedBy && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Người giải quyết</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedReport.resolvedBy.username}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Xử lý báo cáo
              </h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quyết định
                </label>
                <select
                  value={resolveData.status}
                  onChange={(e) => setResolveData({...resolveData, status: e.target.value as 'resolved' | 'rejected'})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="resolved">Chấp nhận báo cáo</option>
                  <option value="rejected">Từ chối báo cáo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú
                </label>
                <textarea
                  value={resolveData.adminNote}
                  onChange={(e) => setResolveData({...resolveData, adminNote: e.target.value})}
                  placeholder="Ghi chú về quyết định xử lý"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              {resolveData.status === 'resolved' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số tiền hoàn lại cho người mua (VND)
                    </label>
                    <input
                      type="number"
                      value={resolveData.refundAmount}
                      onChange={(e) => setResolveData({...resolveData, refundAmount: parseInt(e.target.value) || 0})}
                      min="0"
                      max={selectedReport.productId ? selectedReport.productId.pricePerUnit : 0}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tối đa: {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(selectedReport.productId ? selectedReport.productId.pricePerUnit : 0)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hình phạt cho người bán
                    </label>
                    <select
                      value={resolveData.sellerPenalty.type}
                      onChange={(e) => setResolveData({
                        ...resolveData,
                        sellerPenalty: {
                          ...resolveData.sellerPenalty,
                          type: e.target.value as any
                        }
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2"
                    >
                      <option value="warning">Cảnh báo</option>
                      <option value="credit_deduction">Trừ credit</option>
                      <option value="temporary_ban">Cấm tạm thời</option>
                      <option value="permanent_ban">Cấm vĩnh viễn</option>
                    </select>
                    
                    {resolveData.sellerPenalty.type === 'credit_deduction' && (
                      <input
                        type="number"
                        value={resolveData.sellerPenalty.amount}
                        onChange={(e) => setResolveData({
                          ...resolveData,
                          sellerPenalty: {
                            ...resolveData.sellerPenalty,
                            amount: parseInt(e.target.value) || 0
                          }
                        })}
                        placeholder="Số tiền trừ (VND)"
                        min="0"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2"
                      />
                    )}
                    
                    {resolveData.sellerPenalty.type === 'temporary_ban' && (
                      <input
                        type="number"
                        value={resolveData.sellerPenalty.duration}
                        onChange={(e) => setResolveData({
                          ...resolveData,
                          sellerPenalty: {
                            ...resolveData.sellerPenalty,
                            duration: parseInt(e.target.value) || 0
                          }
                        })}
                        placeholder="Số ngày cấm"
                        min="1"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2"
                      />
                    )}
                    
                    <input
                      type="text"
                      value={resolveData.sellerPenalty.reason}
                      onChange={(e) => setResolveData({
                        ...resolveData,
                        sellerPenalty: {
                          ...resolveData.sellerPenalty,
                          reason: e.target.value
                        }
                      })}
                      placeholder="Lý do hình phạt"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowResolveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={submittingResolve}
              >
                Hủy
              </button>
              <button
                onClick={handleResolveReport}
                disabled={submittingResolve || !resolveData.adminNote || (resolveData.status === 'resolved' && !resolveData.sellerPenalty.reason)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submittingResolve ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
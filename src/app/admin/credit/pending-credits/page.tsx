'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, CheckCircle, XCircle, Filter, Search, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Header from '@/components/Header'

interface User {
  _id: string
  username: string
  email: string
  credit: number
  role: 'admin' | 'manager' | 'seller' | 'buyer'
  isActive: boolean
}

interface PendingCredit {
  _id: string
  userId: {
    _id: string
    username: string
    email: string
  }
  amount: number
  type: 'deposit' | 'withdrawal' | 'purchase' | 'refund' | 'bonus'
  status: 'pending' | 'approved' | 'rejected'
  description: string
  adminNote?: string
  createdAt: string
  updatedAt: string
}

const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
}



export default function AdminPendingCreditsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [pendingCredits, setPendingCredits] = useState<PendingCredit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteModalData, setNoteModalData] = useState<{
    creditId: string
    action: 'approve' | 'reject'
    title: string
    placeholder: string
    required: boolean
  } | null>(null)
  const [noteInput, setNoteInput] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        })
        
        if (!response.ok) {
          router.push('/auth/login')
          return
        }
        
        const data = await response.json()
        if (data.user.role !== USER_ROLES.ADMIN) {
          router.push('/dashboard')
          return
        }
        
        setUser(data.user)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  useEffect(() => {
    if (user && user.role === USER_ROLES.ADMIN) {
      fetchPendingCredits()
    }
  }, [user])

  const fetchPendingCredits = async () => {
    try {
      const response = await fetch('/api/admin/pending-credits', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setPendingCredits(data.pendingCredits || [])
      } else {
        console.error('Failed to fetch pending credits')
      }
    } catch (error) {
      console.error('Error fetching pending credits:', error)
    }
  }

  const openNoteModal = (creditId: string, action: 'approve' | 'reject') => {
    setNoteModalData({
      creditId,
      action,
      title: action === 'approve' ? 'Duyệt yêu cầu' : 'Từ chối yêu cầu',
      placeholder: action === 'approve' ? 'Ghi chú admin (tùy chọn)' : 'Lý do từ chối',
      required: action === 'reject'
    })
    setNoteInput('')
    setShowNoteModal(true)
  }

  const handleNoteSubmit = () => {
    if (noteModalData) {
      if (noteModalData.required && !noteInput.trim()) {
        alert('Vui lòng nhập lý do từ chối')
        return
      }
      handleCreditAction(noteModalData.creditId, noteModalData.action, noteInput.trim() || undefined)
      setShowNoteModal(false)
      setNoteModalData(null)
      setNoteInput('')
    }
  }

  const handleCreditAction = async (creditId: string, action: 'approve' | 'reject', adminNote?: string) => {
    setProcessing(creditId)
    try {
      const response = await fetch('/api/admin/pending-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          creditId,
          action,
          adminNote
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(`✅ ${action === 'approve' ? 'Duyệt' : 'Từ chối'} yêu cầu thành công!`)
        fetchPendingCredits()
      } else {
        alert(`❌ Lỗi: ${data.message}`)
      }
    } catch (error) {
      console.error('Error processing credit:', error)
      alert('❌ Lỗi kết nối')
    } finally {
      setProcessing(null)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/auth/login')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt'
      case 'approved':
        return 'Đã duyệt'
      case 'rejected':
        return 'Đã từ chối'
      default:
        return status
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Nạp tiền'
      case 'withdrawal':
        return 'Rút tiền'
      case 'purchase':
        return 'Mua hàng'
      case 'refund':
        return 'Hoàn tiền'
      case 'bonus':
        return 'Thưởng'
      default:
        return type
    }
  }

  const filteredCredits = pendingCredits.filter(credit => {
    const matchesStatus = statusFilter === 'all' || credit.status === statusFilter
    const matchesType = typeFilter === 'all' || credit.type === typeFilter
    const matchesSearch = searchTerm === '' || 
      credit.userId.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      credit.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesType && matchesSearch
  })

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-gray-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      
      {/* Breadcrumb */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 h-12">
            <Link href="/admin/credit" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại Credit Management
            </Link>
            <div className="h-4 border-l border-gray-300"></div>
            <h1 className="text-lg font-semibold text-gray-900">Pending Credits</h1>
          </div>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow mb-6 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo username, email hoặc mô tả..."
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="sm:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ duyệt</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="rejected">Đã từ chối</option>
                </select>
              </div>
              
              <div className="sm:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại giao dịch
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="deposit">Nạp tiền</option>
                  <option value="withdrawal">Rút tiền</option>
                  <option value="purchase">Mua hàng</option>
                  <option value="refund">Hoàn tiền</option>
                  <option value="bonus">Thưởng</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Danh sách yêu cầu ({filteredCredits.length})
              </h2>
            </div>
            
            {filteredCredits.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Không có yêu cầu nào phù hợp với bộ lọc
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {filteredCredits.map((credit) => (
                  <li key={credit._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(credit.status)}
                          <span className="text-sm font-medium text-gray-900">
                            {getStatusText(credit.status)}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getTypeText(credit.type)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Người dùng:</span>
                            <div className="font-medium">{credit.userId.username}</div>
                            <div className="text-gray-500">{credit.userId.email}</div>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Số tiền:</span>
                            <div className={`font-medium ${
                              credit.type === 'deposit' || credit.type === 'refund' || credit.type === 'bonus'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}>
                              {credit.type === 'deposit' || credit.type === 'refund' || credit.type === 'bonus' ? '+' : '-'}
                              {formatCurrency(credit.amount)}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Mô tả:</span>
                            <div className="font-medium">{credit.description}</div>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Thời gian:</span>
                            <div className="font-medium">
                              {new Date(credit.createdAt).toLocaleString('vi-VN')}
                            </div>
                          </div>
                        </div>
                        
                        {credit.adminNote && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <span className="text-sm text-gray-500">Ghi chú admin:</span>
                            <div className="text-sm font-medium text-gray-900">{credit.adminNote}</div>
                          </div>
                        )}
                      </div>
                      
                      {credit.status === 'pending' && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => openNoteModal(credit._id, 'approve')}
                            disabled={processing === credit._id}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {processing === credit._id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            <span className="ml-1">Duyệt</span>
                          </button>
                          
                          <button
                            onClick={() => openNoteModal(credit._id, 'reject')}
                            disabled={processing === credit._id}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            {processing === credit._id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <span className="ml-1">Từ chối</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {showNoteModal && noteModalData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {noteModalData.title}
              </h3>
              <div className="mb-4">
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder={noteModalData.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required={noteModalData.required}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowNoteModal(false)
                    setNoteModalData(null)
                    setNoteInput('')
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Hủy
                </button>
                <button
                  onClick={handleNoteSubmit}
                  className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                    noteModalData.action === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                  }`}
                >
                  {noteModalData.action === 'approve' ? 'Duyệt' : 'Từ chối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
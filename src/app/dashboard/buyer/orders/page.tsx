'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, ArrowLeft, Package, User, Calendar, Eye, Copy, Check, Download, FileText, CheckSquare, Square, AlertTriangle } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface AccountItem {
  _id: string
  username: string
  password: string
  email?: string
  additionalInfo?: string
  // New fields for flexible account format
  accountData?: string
  fieldNames?: string[]
  status: 'available' | 'sold' | 'reserved'
  soldAt?: string
}

interface Order {
  _id: string
  orderNumber: string
  buyerId: string
  sellerId: {
    _id: string
    username: string
    email: string
  }
  productId: {
    _id: string
    name: string
    title: string
    type: string
    pricePerUnit: number
  }
  accountItems: AccountItem[]
  quantity: number
  pricePerUnit: number
  totalAmount: number
  status: 'pending' | 'completed' | 'cancelled' | 'refunded'
  paymentMethod: 'credit'
  completedAt?: string
  createdAt: string
  updatedAt: string
}

interface User {
  _id: string
  username: string
  email: string
  role: 'admin' | 'manager' | 'seller' | 'buyer'
  credit: number
  isActive: boolean
}

// Helper function to parse account data
const parseAccountData = (account: AccountItem) => {
  if (account.accountData && account.fieldNames) {
    const dataParts = account.accountData.split('|')
    const parsed: { [key: string]: string } = {}
    
    account.fieldNames.forEach((fieldName, index) => {
      parsed[fieldName] = dataParts[index]?.trim() || ''
    })
    
    return {
      ...parsed,
      _isFlexibleFormat: true
    }
  }
  
  // Fallback to legacy format
  return {
    username: account.username || '',
    password: account.password || '',
    email: account.email || '',
    additionalInfo: account.additionalInfo || '',
    _isFlexibleFormat: false
  }
}

export default function BuyerOrdersPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [downloadQuantity, setDownloadQuantity] = useState<number>(1)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportData, setReportData] = useState({
    reportType: 'fake_account',
    title: '',
    description: '',
    evidence: ''
  })
  const [submittingReport, setSubmittingReport] = useState(false)

  useEffect(() => {
    const initializeData = async () => {
      await checkAuth()
      await fetchOrders()
    }
    
    initializeData()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        // Tất cả role đều có thể truy cập trang orders
        setUser(data.user)
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/auth/login')
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/buyer/orders/list')
      
      if (response.ok) {
        const data = await response.json()
        setOrders(data.data.orders)
      } else {
        const errorData = await response.json()
        console.error('API Error:', errorData)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
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

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleSelectAccount = (orderId: string) => {
    const newSelected = new Set(selectedAccounts)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedAccounts(newSelected)
    setSelectAll(newSelected.size === orders.length)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAccounts(new Set())
      setSelectAll(false)
    } else {
      setSelectedAccounts(new Set(orders.map(order => order._id)))
      setSelectAll(true)
    }
  }

  const handleReportProduct = async () => {
    if (!selectedOrder || !selectedOrder.accountItems || selectedOrder.accountItems.length === 0) return
    
    setSubmittingReport(true)
    try {
      // Sử dụng accountItem đầu tiên trong order để báo cáo
      const accountItemId = selectedOrder.accountItems[0]._id
      
      const response = await fetch('/api/buyer/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          accountItemId: accountItemId,
          reportType: reportData.reportType,
          title: reportData.title,
          description: reportData.description,
          evidence: reportData.evidence ? [reportData.evidence] : []
        })
      })
      
      if (response.ok) {
        alert('Báo cáo đã được gửi thành công!')
        setShowReportModal(false)
        setReportData({
          reportType: 'fake_account',
          title: '',
          description: '',
          evidence: ''
        })
      } else {
        const error = await response.json()
        alert(error.message || 'Có lỗi xảy ra khi gửi báo cáo')
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      alert('Có lỗi xảy ra khi gửi báo cáo')
    } finally {
      setSubmittingReport(false)
    }
  }

  const downloadSelectedAccounts = () => {
    const selectedOrdersList = orders.filter(order => selectedAccounts.has(order._id))
    const limitedOrders = selectedOrdersList.slice(0, downloadQuantity)
    
    if (limitedOrders.length === 0) {
      alert('Vui lòng chọn ít nhất một đơn hàng để tải xuống')
      return
    }

    let content = ''
    
    limitedOrders.forEach((order, orderIndex) => {
      if (orderIndex > 0) content += '\n\n'
      
      // PHẦN 1: THÔNG TIN ĐỚN HÀNG
      content += `=== ĐỚN HÀNG ${order.orderNumber} ===\n`
      content += `Sản phẩm: ${order.productId.title || order.productId.name}\n`
      content += `Loại: ${order.productId.type}\n`
      content += `Số lượng: ${order.quantity}\n`
      content += `Tổng tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)}\n`
      content += `Người bán: ${order.sellerId?.username || 'N/A'}\n`
      content += `Ngày mua: ${new Date(order.createdAt).toLocaleString('vi-VN')}\n\n`
      
      // PHẦN 2: DANH SÁCH TÀI KHOẢN
      content += `--- DANH SÁCH TÀI KHOẢN ---\n`
      
      order.accountItems.forEach((account, index) => {
        const parsedData = parseAccountData(account)
        
        if (parsedData._isFlexibleFormat) {
          // Sử dụng accountData trực tiếp cho flexible format
          content += `${index + 1}. ${account.accountData || ''}\n`
        } else {
          // Fallback cho legacy format
          const parts = [
            parsedData.username,
            parsedData.password,
            parsedData.email,
            parsedData.additionalInfo
          ].filter(part => part && part.trim() !== '')
          content += `${index + 1}. ${parts.join('|')}\n`
        }
      })
    })

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tai-khoan-da-mua-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    setShowDownloadModal(false)
  }

  // No need to group orders anymore since each order is separate

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header user={user} onLogout={handleLogout} />

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/marketplace"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại Marketplace
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Package className="h-8 w-8 mr-3 text-blue-600" />
              Đơn Hàng Của Tôi
            </h1>
            <p className="text-gray-600 mt-2">Quản lý và xem thông tin các tài khoản đã mua</p>
          </div>
          
          {orders.length > 0 && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {selectAll ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  <span>{selectAll ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span>
                </button>
                <span className="text-sm text-gray-600">
                  Đã chọn: {selectedAccounts.size}/{orders.length}
                </span>
              </div>
              
              <button
                onClick={() => setShowDownloadModal(true)}
                disabled={selectedAccounts.size === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                <span>Tải xuống ({selectedAccounts.size})</span>
              </button>
            </div>
          )}
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có đơn hàng nào</h3>
            <p className="mt-1 text-sm text-gray-500">Bạn chưa mua sản phẩm nào.</p>
            <Link
              href="/marketplace"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{order.productId.title || order.productId.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {order.orderNumber}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Package className="h-4 w-4 mr-1" />
                          {order.productId.type}
                        </span>
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {order.sellerId?.username || 'N/A'}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-blue-600">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(order.totalAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.quantity} tài khoản
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {order.pricePerUnit.toLocaleString('vi-VN')} VND/tài khoản
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">Tài khoản đã mua:</h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSelectAccount(order._id)}
                          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          {selectedAccounts.has(order._id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                          <span>{selectedAccounts.has(order._id) ? 'Bỏ chọn' : 'Chọn đơn hàng'}</span>
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Chi tiết</span>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {order.accountItems.map((account, index) => {
                        const accountData = parseAccountData(account)
                        return (
                          <div key={account._id} className="border rounded-lg p-4 border-gray-200 hover:border-gray-300">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Tài khoản #{index + 1}</span>
                              <button
                                onClick={() => {
                                  // Copy all account info
                                  const info = accountData._isFlexibleFormat 
                                    ? account.accountData 
                                    : `${accountData.username}|${accountData.password}|${accountData.email}|${accountData.additionalInfo}`
                                  copyToClipboard(info || '', `full-${account._id}`)
                                }}
                                className="text-blue-600 hover:text-blue-800"
                                title="Sao chép toàn bộ"
                              >
                                {copiedField === `full-${account._id}` ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            <div className="space-y-1 text-sm">
                              {accountData._isFlexibleFormat ? (
                                // Display flexible format like legacy format
                                <>
                                  {Object.entries(accountData).map(([key, value]) => {
                                    if (key === '_isFlexibleFormat') return null
                                    const isPassword = key.toLowerCase().includes('pass')
                                    return (
                                      <div key={key} className="flex items-center justify-between">
                                        <span className="text-gray-600 capitalize">{key}:</span>
                                        <div className="flex items-center space-x-1">
                                          <span className="font-mono text-gray-900">
                                            {isPassword ? '•'.repeat(8) : value}
                                          </span>
                                          <button
                                            onClick={() => copyToClipboard(value, `${key}-${account._id}`)}
                                            className="text-gray-400 hover:text-gray-600"
                                            title={`Sao chép ${key}`}
                                          >
                                            {copiedField === `${key}-${account._id}` ? (
                                              <Check className="h-3 w-3 text-green-600" />
                                            ) : (
                                              <Copy className="h-3 w-3" />
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </>
                              ) : (
                                // Display legacy format
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Username:</span>
                                    <div className="flex items-center space-x-1">
                                      <span className="font-mono text-gray-900">{accountData.username}</span>
                                      <button
                                        onClick={() => copyToClipboard(accountData.username || '', `username-${account._id}`)}
                                        className="text-gray-400 hover:text-gray-600"
                                        title="Sao chép"
                                      >
                                        {copiedField === `username-${account._id}` ? (
                                          <Check className="h-3 w-3 text-green-600" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Password:</span>
                                    <div className="flex items-center space-x-1">
                                      <span className="font-mono text-gray-900">{'•'.repeat(8)}</span>
                                      <button
                                        onClick={() => copyToClipboard(accountData.password || '', `password-${account._id}`)}
                                        className="text-gray-400 hover:text-gray-600"
                                        title="Sao chép mật khẩu"
                                      >
                                        {copiedField === `password-${account._id}` ? (
                                          <Check className="h-3 w-3 text-green-600" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                              {account.soldAt && (
                                <div className="flex items-center text-xs text-gray-500 mt-2">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Mua ngày {new Date(account.soldAt).toLocaleDateString('vi-VN')}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Chi tiết đơn hàng</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">Số đơn hàng: {selectedOrder.orderNumber}</h4>
                      <p className="text-sm text-blue-700">Trạng thái: {selectedOrder.status === 'completed' ? 'Hoàn thành' : selectedOrder.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-900">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.totalAmount)}
                      </p>
                      <p className="text-sm text-blue-700">{selectedOrder.quantity} tài khoản</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sản phẩm</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedOrder.productId.title || selectedOrder.productId.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loại</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOrder.productId.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày mua</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Người bán</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedOrder.sellerId?.username || 'N/A'} ({selectedOrder.sellerId?.email || 'N/A'})
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Danh sách tài khoản ({selectedOrder.accountItems.length}):</h4>
                  
                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {selectedOrder.accountItems.map((account, index) => {
                      const accountData = parseAccountData(account)
                      return (
                        <div key={account._id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-gray-900">Tài khoản #{index + 1}</h5>
                            <button
                              onClick={() => {
                                const info = accountData._isFlexibleFormat 
                                  ? account.accountData 
                                  : `${accountData.username}|${accountData.password}|${accountData.email}|${accountData.additionalInfo}`
                                copyToClipboard(info || '', `modal-full-${account._id}`)
                              }}
                              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              {copiedField === `modal-full-${account._id}` ? 'Đã sao chép!' : 'Sao chép tất cả'}
                            </button>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            {accountData._isFlexibleFormat ? (
                              <div>
                                <code className="block px-2 py-1 bg-white rounded text-xs font-mono break-all">
                                  {account.accountData}
                                </code>
                              </div>
                            ) : (
                              <>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="text-gray-600">Username:</span>
                                    <code className="block px-2 py-1 bg-white rounded text-xs font-mono">
                                      {accountData.username}
                                    </code>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Password:</span>
                                    <code className="block px-2 py-1 bg-white rounded text-xs font-mono">
                                      {accountData.password}
                                    </code>
                                  </div>
                                </div>
                                {(accountData.email || accountData.additionalInfo) && (
                                  <div className="grid grid-cols-1 gap-2">
                                    {accountData.email && (
                                      <div>
                                        <span className="text-gray-600">Email:</span>
                                        <code className="block px-2 py-1 bg-white rounded text-xs font-mono">
                                          {accountData.email}
                                        </code>
                                      </div>
                                    )}
                                    {accountData.additionalInfo && (
                                      <div>
                                        <span className="text-gray-600">Thông tin thêm:</span>
                                        <div className="px-2 py-1 bg-white rounded text-xs">
                                          {accountData.additionalInfo}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Giá đã trả</label>
                      <p className="mt-1 text-sm font-semibold text-blue-600">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(selectedOrder.productId.pricePerUnit)}
                      </p>
                    </div>
                    {selectedOrder.createdAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Ngày mua</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Báo cáo sản phẩm</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Tải xuống tài khoản
              </h3>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                Bạn đã chọn <span className="font-semibold text-blue-600">{selectedAccounts.size}</span> tài khoản.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số lượng tài khoản muốn tải xuống:
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setDownloadQuantity(Math.max(1, downloadQuantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    disabled={downloadQuantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedAccounts.size}
                    value={downloadQuantity}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1
                      setDownloadQuantity(Math.min(Math.max(1, value), selectedAccounts.size))
                    }}
                    className="w-20 text-center border border-gray-300 rounded-md px-2 py-1"
                  />
                  <button
                    onClick={() => setDownloadQuantity(Math.min(selectedAccounts.size, downloadQuantity + 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    disabled={downloadQuantity >= selectedAccounts.size}
                  >
                    +
                  </button>
                  <button
                    onClick={() => setDownloadQuantity(selectedAccounts.size)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    Tất cả
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tối đa {selectedAccounts.size} tài khoản đã chọn
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Thông tin file tải xuống:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Định dạng: File văn bản (.txt)</li>
                  <li>• Mã hóa: UTF-8</li>
                  <li>• Bao gồm: Username, Password, Email, thông tin bổ sung</li>
                  <li>• Tên file: tai-khoan-da-mua-{new Date().toISOString().split('T')[0]}.txt</li>
                </ul>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={downloadSelectedAccounts}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Tải xuống {downloadQuantity} tài khoản</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                Báo cáo sản phẩm
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại báo cáo
                </label>
                <select
                  value={reportData.reportType}
                  onChange={(e) => setReportData({...reportData, reportType: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="fake_account">Tài khoản giả mạo</option>
                  <option value="wrong_info">Thông tin sai</option>
                  <option value="not_working">Tài khoản không hoạt động</option>
                  <option value="scam">Lừa đảo</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={reportData.title}
                  onChange={(e) => setReportData({...reportData, title: e.target.value})}
                  placeholder="Nhập tiêu đề báo cáo"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả chi tiết
                </label>
                <textarea
                  value={reportData.description}
                  onChange={(e) => setReportData({...reportData, description: e.target.value})}
                  placeholder="Mô tả chi tiết vấn đề bạn gặp phải"
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bằng chứng (tùy chọn)
                </label>
                <textarea
                  value={reportData.evidence}
                  onChange={(e) => setReportData({...reportData, evidence: e.target.value})}
                  placeholder="Link ảnh chụp màn hình hoặc mô tả bằng chứng"
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={submittingReport}
              >
                Hủy
              </button>
              <button
                onClick={handleReportProduct}
                disabled={submittingReport || !reportData.title || !reportData.description}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center space-x-2"
              >
                {submittingReport ? (
                  <span>Đang gửi...</span>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    <span>Gửi báo cáo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      
      <Footer />
    </div>
  )
}
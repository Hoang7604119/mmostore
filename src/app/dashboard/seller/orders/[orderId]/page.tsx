'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, User, Calendar, DollarSign, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react'
import Header from '@/components/Header'
import { UserData } from '@/types/user'

interface User extends UserData {
  credit: number
}

interface Order {
  _id: string
  orderNumber: string
  buyerId: {
    _id: string
    username: string
    email: string
  }
  productId: {
    _id: string
    title: string
    type: string
    category: string
    pricePerUnit: number
    description: string
  }
  accountItems: Array<{
    _id: string
    username: string
    password: string
    email?: string
    additionalInfo?: string
  }>
  quantity: number
  pricePerUnit: number
  totalAmount: number
  status: string
  paymentMethod: string
  createdAt: string
  completedAt?: string
  notes?: string
}

interface OrderResponse {
  success: boolean
  data: Order
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'pending':
      return <Clock className="h-5 w-5 text-yellow-500" />
    case 'cancelled':
      return <XCircle className="h-5 w-5 text-red-500" />
    case 'refunded':
      return <RefreshCw className="h-5 w-5 text-blue-500" />
    default:
      return <Clock className="h-5 w-5 text-gray-500" />
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Hoàn thành'
    case 'pending':
      return 'Đang xử lý'
    case 'cancelled':
      return 'Đã hủy'
    case 'refunded':
      return 'Đã hoàn tiền'
    default:
      return status
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    case 'refunded':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function OrderDetailPage() {
  const [user, setUser] = useState<User | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    }
  }

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        router.push('/login')
      }
    }

    fetchUserData()
  }, [router])

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user || !orderId) return

      try {
        setLoading(true)
        const response = await fetch(`/api/seller/orders/${orderId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch order')
        }

        const result: OrderResponse = await response.json()
        setOrder(result.data)
      } catch (error) {
        console.error('Error fetching order:', error)
        setError('Không thể tải thông tin đơn hàng')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [user, orderId])

  if (!user) {
    return <div>Loading...</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={logout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogout={logout} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/dashboard/seller/orders" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách đơn hàng
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy đơn hàng</h2>
            <p className="text-gray-600">{error || 'Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={logout} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/dashboard/seller/orders" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách đơn hàng
          </Link>
        </div>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Đơn hàng #{order.orderNumber}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Đặt hàng vào {new Date(order.createdAt).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center">
                {getStatusIcon(order.status)}
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Khách hàng</p>
                  <p className="text-sm text-gray-600">{order.buyerId.username}</p>
                  <p className="text-xs text-gray-500">{order.buyerId.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Tổng tiền</p>
                  <p className="text-lg font-bold text-green-600">{order.totalAmount.toLocaleString('vi-VN')} VNĐ</p>
                </div>
              </div>
              <div className="flex items-center">
                <Package className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Số lượng</p>
                  <p className="text-sm text-gray-600">{order.quantity} tài khoản</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Information */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Thông tin sản phẩm</h2>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-start space-x-4">
              <Package className="h-12 w-12 text-blue-500 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{order.productId.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{order.productId.description}</p>
                <div className="mt-2 flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    Loại: <span className="font-medium">{order.productId.type}</span>
                  </span>
                  <span className="text-sm text-gray-500">
                    Danh mục: <span className="font-medium">{order.productId.category}</span>
                  </span>
                  <span className="text-sm text-gray-500">
                    Giá: <span className="font-medium">{order.pricePerUnit.toLocaleString('vi-VN')} VNĐ/tài khoản</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Items */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Tài khoản đã bán ({order.accountItems.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Password
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thông tin thêm
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.accountItems.map((account, index) => (
                  <tr key={account._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {account.password}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {account.email || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {account.additionalInfo || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Thông tin thanh toán</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Phương thức thanh toán</p>
                <p className="text-sm text-gray-600">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Thời gian hoàn thành</p>
                <p className="text-sm text-gray-600">
                  {order.completedAt 
                    ? new Date(order.completedAt).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Chưa hoàn thành'
                  }
                </p>
              </div>
            </div>
            {order.notes && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Ghi chú</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
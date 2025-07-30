'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PendingPayment {
  orderCode: number
  amount: number
  status: string
  user: {
    username: string
    email: string
  } | null
  createdAt: string
}

interface PaymentSyncData {
  totalPending: number
  payments: PendingPayment[]
}

export default function AdminPaymentsPage() {
  const { user, loading } = useAuth()
  const [pendingPayments, setPendingPayments] = useState<PaymentSyncData | null>(null)
  const [loadingSync, setLoadingSync] = useState(false)
  const [syncingOrderCode, setSyncingOrderCode] = useState<number | null>(null)

  // Redirect if not admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      window.location.href = '/dashboard'
    }
  }, [user, loading])

  // Fetch pending payments
  const fetchPendingPayments = async () => {
    try {
      setLoadingSync(true)
      const response = await fetch('/api/payment/sync', {
        method: 'GET',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setPendingPayments(data.data)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Lỗi lấy danh sách payments')
      }
    } catch (error) {
      console.error('Fetch pending payments error:', error)
      toast.error('Lỗi kết nối')
    } finally {
      setLoadingSync(false)
    }
  }

  // Sync specific payment
  const syncPayment = async (orderCode: number) => {
    try {
      setSyncingOrderCode(orderCode)
      const response = await fetch('/api/payment/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ orderCode })
      })

      const data = await response.json()
      
      if (response.ok) {
        if (data.success) {
          toast.success(data.message)
          // Refresh the list
          await fetchPendingPayments()
        }
      } else {
        toast.error(data.error || 'Lỗi sync payment')
      }
    } catch (error) {
      console.error('Sync payment error:', error)
      toast.error('Lỗi kết nối')
    } finally {
      setSyncingOrderCode(null)
    }
  }

  // Load data on mount
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPendingPayments()
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Thanh toán</h1>
        <p className="text-gray-600">Đồng bộ trạng thái thanh toán từ PayOS</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayments?.totalPending || 0}</div>
            <p className="text-xs text-muted-foreground">Payments cần xử lý</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhook Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Offline</div>
            <p className="text-xs text-muted-foreground">Cần kiểm tra cấu hình</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button 
              onClick={fetchPendingPayments}
              disabled={loadingSync}
              className="w-full"
            >
              {loadingSync ? 'Đang tải...' : 'Refresh'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payments Đang Chờ Xử Lý</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSync ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : pendingPayments?.payments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>Không có payments nào cần xử lý</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments?.payments.map((payment) => (
                <div key={payment.orderCode} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        #{payment.orderCode}
                      </span>
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        {payment.status}
                      </Badge>
                      <span className="text-lg font-semibold text-green-600">
                        {payment.amount.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p><strong>User:</strong> {payment.user?.username} ({payment.user?.email})</p>
                      <p><strong>Thời gian:</strong> {new Date(payment.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => syncPayment(payment.orderCode)}
                      disabled={syncingOrderCode === payment.orderCode}
                      size="sm"
                    >
                      {syncingOrderCode === payment.orderCode ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Sync'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Webhook URL</h4>
              <code className="bg-gray-100 p-2 rounded block text-sm">
                https://mmostore.site/api/payment/webhook
              </code>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Các bước kiểm tra</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Kiểm tra webhook URL trong PayOS Dashboard</li>
                <li>Xem logs server để tìm webhook requests</li>
                <li>Kiểm tra SSL certificate và firewall</li>
                <li>Liên hệ PayOS support nếu cần</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
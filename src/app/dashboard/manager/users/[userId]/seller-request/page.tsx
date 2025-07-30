'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { UserData } from '@/types/user'
import Header from '@/components/Header'
import { 
  ArrowLeft, 
  User, 
  CreditCard, 
  Building, 
  Phone, 
  MapPin, 
  FileText, 
  Check, 
  X,
  Calendar,
  AlertCircle
} from 'lucide-react'

interface UserWithCredit extends UserData {
  credit: number
}

interface SellerRequestUser {
  _id: string
  username: string
  email: string
  role: string
  credit: number
  sellerRequest: {
    status: 'pending' | 'approved' | 'rejected'
    requestedAt: string
    reviewedAt?: string
    reviewedBy?: string
    note?: string
    personalInfo?: {
      fullName: string
      phoneNumber: string
      address: string
      idNumber: string
    }
    bankAccount?: {
      bankName: string
      accountNumber: string
      accountHolder: string
      branch?: string
    }
  }
}

export default function SellerRequestDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  
  const [requestUser, setRequestUser] = useState<SellerRequestUser | null>(null)
  const [loadingRequest, setLoadingRequest] = useState(true)
  const [processing, setProcessing] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/auth/login')
  }

  useEffect(() => {
    if (!loading && (!user || !['admin', 'manager'].includes(user.role))) {
      router.push('/dashboard')
      return
    }

    if (userId) {
      fetchSellerRequest()
    }
  }, [user, loading, userId, router])

  const fetchSellerRequest = async () => {
    try {
      const response = await fetch(`/api/admin/seller-request/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setRequestUser(data.user)
      } else {
        alert('Không thể tải thông tin yêu cầu')
        router.back()
      }
    } catch (error) {
      console.error('Fetch seller request error:', error)
      alert('Có lỗi xảy ra khi tải thông tin')
      router.back()
    } finally {
      setLoadingRequest(false)
    }
  }

  const handleApproveReject = async (action: 'approve' | 'reject', note?: string) => {
    if (!requestUser) return

    setProcessing(true)
    try {
      const response = await fetch(`/api/admin/seller-request/${requestUser._id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          note
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message)
        router.push('/dashboard/manager/users')
      } else {
        alert(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Approve/Reject error:', error)
      alert('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = () => {
    const note = prompt('Lý do từ chối (tùy chọn):')
    handleApproveReject('reject', note || undefined)
  }

  if (loading || loadingRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !requestUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Quay lại danh sách
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Chi tiết yêu cầu Seller</h1>
          <p className="text-gray-600 mt-2">
            Xem xét thông tin và quyết định phê duyệt yêu cầu trở thành seller
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Thông tin tài khoản</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              requestUser.sellerRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              requestUser.sellerRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {requestUser.sellerRequest.status === 'pending' ? 'Đang chờ duyệt' :
               requestUser.sellerRequest.status === 'approved' ? 'Đã được duyệt' :
               'Bị từ chối'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tên đăng nhập</label>
              <p className="mt-1 text-gray-900">{requestUser.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-gray-900">{requestUser.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vai trò hiện tại</label>
              <p className="mt-1 text-gray-900">{requestUser.role}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số dư</label>
              <p className="mt-1 text-gray-900">{requestUser.credit.toLocaleString('vi-VN')} VNĐ</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ngày gửi yêu cầu</label>
              <p className="mt-1 text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(requestUser.sellerRequest.requestedAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
            {requestUser.sellerRequest.reviewedAt && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Ngày xem xét</label>
                <p className="mt-1 text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(requestUser.sellerRequest.reviewedAt).toLocaleDateString('vi-VN')}
                </p>
              </div>
            )}
          </div>
          
          {requestUser.sellerRequest.note && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-medium text-blue-900 mb-2">Ghi chú từ quản lý:</label>
              <p className="text-blue-800">{requestUser.sellerRequest.note}</p>
            </div>
          )}
        </div>

        {/* Personal Info */}
        {requestUser.sellerRequest.personalInfo ? (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center mb-6">
              <User className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
                <p className="mt-1 text-gray-900">{requestUser.sellerRequest.personalInfo.fullName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                <p className="mt-1 text-gray-900 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {requestUser.sellerRequest.personalInfo.phoneNumber}
                </p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                <p className="mt-1 text-gray-900 flex items-start">
                  <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                  {requestUser.sellerRequest.personalInfo.address}
                </p>
              </div>
              
              {requestUser.sellerRequest.personalInfo.idNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Số CMND/CCCD</label>
                  <p className="mt-1 text-gray-900 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    {requestUser.sellerRequest.personalInfo.idNumber}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-yellow-900">Chưa có thông tin cá nhân</h3>
                <p className="text-yellow-700">Người dùng chưa cung cấp thông tin cá nhân</p>
              </div>
            </div>
          </div>
        )}

        {/* Bank Account Info */}
        {requestUser.sellerRequest.bankAccount ? (
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
            <div className="flex items-center mb-6">
              <CreditCard className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Thông tin tài khoản ngân hàng</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên ngân hàng</label>
                <p className="mt-1 text-gray-900 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  {requestUser.sellerRequest.bankAccount.bankName}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Số tài khoản</label>
                <p className="mt-1 text-gray-900 font-mono">{requestUser.sellerRequest.bankAccount.accountNumber}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Tên chủ tài khoản</label>
                <p className="mt-1 text-gray-900">{requestUser.sellerRequest.bankAccount.accountHolder}</p>
              </div>
              
              {requestUser.sellerRequest.bankAccount.branch && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chi nhánh</label>
                  <p className="mt-1 text-gray-900">{requestUser.sellerRequest.bankAccount.branch}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-yellow-900">Chưa có thông tin ngân hàng</h3>
                <p className="text-yellow-700">Người dùng chưa cung cấp thông tin tài khoản ngân hàng</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {requestUser.sellerRequest.status === 'pending' && 
         requestUser.sellerRequest.personalInfo && 
         requestUser.sellerRequest.bankAccount && (
          <div className="flex justify-end space-x-4">
            <button
              onClick={handleReject}
              disabled={processing}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {processing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <X className="h-5 w-5 mr-2" />
              )}
              Từ chối
            </button>
            <button
              onClick={() => handleApproveReject('approve')}
              disabled={processing}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {processing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Check className="h-5 w-5 mr-2" />
              )}
              Phê duyệt
            </button>
          </div>
        )}
        
        {requestUser.sellerRequest.status === 'pending' && 
         (!requestUser.sellerRequest.personalInfo || !requestUser.sellerRequest.bankAccount) && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <div className="flex items-center">
              <AlertCircle className="h-6 w-6 text-orange-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-orange-900">Chưa thể phê duyệt</h3>
                <p className="text-orange-700">Người dùng cần hoàn thiện thông tin cá nhân và tài khoản ngân hàng trước khi có thể được phê duyệt</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
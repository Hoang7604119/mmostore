'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { UserData } from '@/types/user'
import Header from '@/components/Header'
import { ArrowLeft, User, CreditCard, Building, Phone, MapPin, FileText, Save } from 'lucide-react'

interface UserWithCredit extends UserData {
  credit: number
  sellerRequest?: {
    status: 'pending' | 'approved' | 'rejected'
    requestedAt: Date
    reviewedAt?: Date
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

export default function CompleteSellerInfoPage() {
  const { user, loading, refetch } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  
  const [personalInfo, setPersonalInfo] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    idNumber: ''
  })
  
  const [bankAccount, setBankAccount] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    branch: '' as string | undefined
  })

  const handleLogout = () => {
    localStorage.removeItem('token')
    router.push('/auth/login')
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }

    if (!loading && user) {
      // Kiểm tra xem user đã gửi yêu cầu seller chưa
      if (!user.sellerRequest || user.sellerRequest.status !== 'pending') {
        router.push('/become-seller')
        return
      }

      // Nếu đã có thông tin, điền vào form
      if (user.sellerRequest.personalInfo) {
        setPersonalInfo(user.sellerRequest.personalInfo)
      }
      if (user.sellerRequest.bankAccount) {
        setBankAccount({
          ...user.sellerRequest.bankAccount,
          branch: user.sellerRequest.bankAccount.branch || ''
        })
      }
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!personalInfo.fullName || !personalInfo.phoneNumber || !personalInfo.address || 
        !bankAccount.bankName || !bankAccount.accountNumber || !bankAccount.accountHolder) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/auth/complete-seller-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalInfo,
          bankAccount
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Thông tin đã được cập nhật thành công!')
        await refetch()
        router.push('/dashboard')
      } else {
        alert(data.error || 'Có lỗi xảy ra khi cập nhật thông tin')
      }
    } catch (error) {
      console.error('Submit error:', error)
      alert('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
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
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Hoàn thiện thông tin Seller</h1>
          <p className="text-gray-600 mt-2">
            Vui lòng cung cấp thông tin cá nhân và tài khoản ngân hàng để hoàn tất đăng ký
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Thông tin cá nhân */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <User className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Thông tin cá nhân</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={personalInfo.fullName}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập họ và tên đầy đủ"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={personalInfo.phoneNumber}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    value={personalInfo.address}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập địa chỉ đầy đủ"
                    rows={3}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số CMND/CCCD (tùy chọn)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={personalInfo.idNumber}
                    onChange={(e) => setPersonalInfo(prev => ({ ...prev, idNumber: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nhập số CMND/CCCD"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin tài khoản ngân hàng */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center mb-6">
              <CreditCard className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Thông tin tài khoản ngân hàng</h2>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý:</strong> Thông tin tài khoản ngân hàng này sẽ được sử dụng để rút tiền. 
                Sau khi được duyệt, bạn không thể thay đổi thông tin này. Nếu cần thay đổi, vui lòng liên hệ admin.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên ngân hàng <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={bankAccount.bankName}
                    onChange={(e) => setBankAccount(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Chọn ngân hàng</option>
                    <option value="Vietcombank">Vietcombank</option>
                    <option value="VietinBank">VietinBank</option>
                    <option value="BIDV">BIDV</option>
                    <option value="Agribank">Agribank</option>
                    <option value="Techcombank">Techcombank</option>
                    <option value="MBBank">MBBank</option>
                    <option value="ACB">ACB</option>
                    <option value="VPBank">VPBank</option>
                    <option value="TPBank">TPBank</option>
                    <option value="Sacombank">Sacombank</option>
                    <option value="HDBank">HDBank</option>
                    <option value="SHB">SHB</option>
                    <option value="VIB">VIB</option>
                    <option value="MSB">MSB</option>
                    <option value="OCB">OCB</option>
                    <option value="Eximbank">Eximbank</option>
                    <option value="SeABank">SeABank</option>
                    <option value="LienVietPostBank">LienVietPostBank</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankAccount.accountNumber}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, accountNumber: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập số tài khoản"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên chủ tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankAccount.accountHolder}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, accountHolder: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên chủ tài khoản"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chi nhánh (tùy chọn)
                </label>
                <input
                  type="text"
                  value={bankAccount.branch}
                  onChange={(e) => setBankAccount(prev => ({ ...prev, branch: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập tên chi nhánh"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Lưu thông tin
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
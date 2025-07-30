'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Edit3, 
  Save, 
  X,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react'
import Header from '@/components/Header'
import { UserData } from '@/types/user'

interface UserWithCredit extends UserData {
  credit: number
  createdAt: string
  updatedAt: string
}

interface ProfileFormData {
  username: string
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          setFormData({
            username: data.user.username,
            email: data.user.email,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          })
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSaveProfile = async () => {
    if (!user) return

    // Validate form
    if (!formData.username.trim()) {
      alert('Vui lòng điền tên người dùng')
      return
    }

    if (isChangingPassword) {
      if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
        alert('Vui lòng điền đầy đủ thông tin mật khẩu')
        return
      }

      if (formData.newPassword !== formData.confirmPassword) {
        alert('Mật khẩu mới và xác nhận mật khẩu không khớp')
        return
      }

      if (formData.newPassword.length < 6) {
        alert('Mật khẩu mới phải có ít nhất 6 ký tự')
        return
      }
    }

    setSaving(true)
    try {
      const updateData: any = {
        username: formData.username
      }

      if (isChangingPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Cập nhật thông tin thành công!')
        setUser(prev => prev ? { ...prev, ...data.user } : null)
        setIsEditing(false)
        setIsChangingPassword(false)
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }))
      } else {
        alert(data.error || 'Có lỗi xảy ra khi cập nhật thông tin')
      }
    } catch (error) {
      console.error('Update profile error:', error)
      alert('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (!user) return
    
    setFormData(prev => ({
      ...prev,
      username: user.username,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }))
    setIsEditing(false)
    setIsChangingPassword(false)
  }

  const handleSendSellerRequest = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/seller-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        alert('Gửi yêu cầu trở thành seller thành công!')
        setUser(prev => prev ? { ...prev, ...data.user } : null)
      } else {
        alert(data.error || 'Có lỗi xảy ra khi gửi yêu cầu')
      }
    } catch (error) {
      console.error('Send seller request error:', error)
      alert('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelSellerRequest = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu trở thành seller?')) {
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/user/seller-request', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        alert('Hủy yêu cầu thành công!')
        setUser(prev => prev ? { ...prev, ...data.user } : null)
      } else {
        alert(data.error || 'Có lỗi xảy ra khi hủy yêu cầu')
      }
    } catch (error) {
      console.error('Cancel seller request error:', error)
      alert('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setSaving(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị viên'
      case 'manager': return 'Quản lý'
      case 'seller': return 'Người bán'
      case 'buyer': return 'Người mua'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'manager': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'seller': return 'bg-green-100 text-green-800 border-green-200'
      case 'buyer': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

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
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link href={`/dashboard/${user.role}`} className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại Dashboard
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
                <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
              </div>
            </div>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </button>
            )}
          </div>

          {/* Profile Information */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
              
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên người dùng
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-900">{user.username}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{user.email}</span>
                  <span className="ml-2 text-xs text-gray-500">(Không thể thay đổi)</span>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vai trò
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Shield className="h-4 w-4 text-gray-400 mr-2" />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin tài khoản</h3>
              
              {/* Credit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số dư tài khoản
                </label>
                <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-green-800 font-semibold">
                    {(user.credit || 0).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>

              {/* Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày tạo tài khoản
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{formatDate(user.createdAt)}</span>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái tài khoản
                </label>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    user.isActive ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className={`font-medium ${
                    user.isActive ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Password Change Section */}
          {isEditing && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Đổi mật khẩu</h3>
                <button
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {isChangingPassword ? 'Hủy đổi mật khẩu' : 'Đổi mật khẩu'}
                </button>
              </div>

              {isChangingPassword && (
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu hiện tại
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập mật khẩu hiện tại"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Nhập mật khẩu mới"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Xác nhận mật khẩu mới"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleCancelEdit}
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Hủy
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          )}
        </div>

        {/* Seller Request Section (for buyers) */}
        {user.role === 'buyer' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Yêu cầu trở thành người bán</h3>
            
            {user.sellerRequest ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Trạng thái yêu cầu</p>
                    <p className="text-sm text-gray-600">Đã gửi yêu cầu vào {formatDate(user.sellerRequest.requestedAt.toString())}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.sellerRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      user.sellerRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.sellerRequest.status === 'pending' ? 'Đang chờ duyệt' :
                       user.sellerRequest.status === 'approved' ? 'Đã được duyệt' :
                       'Bị từ chối'}
                    </span>
                    {user.sellerRequest.status === 'pending' && (
                      <button
                        onClick={handleCancelSellerRequest}
                        disabled={saving}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Đang hủy...' : 'Hủy yêu cầu'}
                      </button>
                    )}
                  </div>
                </div>
                
                {user.sellerRequest.note && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium text-blue-900 mb-2">Ghi chú từ quản lý:</p>
                    <p className="text-blue-800">{user.sellerRequest.note}</p>
                  </div>
                )}
                
                {user.sellerRequest.status === 'rejected' && (
                  <div className="text-center py-4">
                    <button 
                      onClick={handleSendSellerRequest}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Đang gửi...' : 'Gửi lại yêu cầu'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Bạn chưa gửi yêu cầu trở thành người bán</p>
                <button 
                  onClick={handleSendSellerRequest}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
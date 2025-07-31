'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Store, Users, TrendingUp, Shield, CheckCircle, ArrowRight, User } from 'lucide-react'
import { UserData } from '@/types/user'
import Footer from '@/components/Footer'

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

export default function BecomeSellerPage() {
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
          
          // Nếu đã là seller, manager hoặc admin thì chuyển hướng
          if (['seller', 'manager', 'admin'].includes(data.user.role)) {
            router.push('/dashboard/seller')
            return
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleUpgradeToSeller = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setUpgrading(true)
    try {
      const response = await fetch('/api/auth/upgrade-to-seller', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        // Cập nhật user state với thông tin sellerRequest
        setUser(data.user)
        alert(data.message)
        // Chuyển hướng đến trang nhập thông tin
        router.push('/become-seller/complete-info')
      } else {
        alert(data.error || 'Có lỗi xảy ra khi gửi yêu cầu')
      }
    } catch (error) {
      console.error('Request error:', error)
      alert('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setUpgrading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center touch-manipulation">
                <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <span className="ml-2 text-lg sm:text-xl font-bold text-gray-900">MMO Store</span>
              </Link>
            </div>
            <nav className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/marketplace" className="text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium touch-manipulation">
                <span className="hidden sm:inline">Marketplace</span>
                <span className="sm:hidden">Shop</span>
              </Link>
              {user ? (
                <>
                  <div className="bg-green-100 px-2 sm:px-3 py-1 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-800 font-semibold text-xs sm:text-sm">
                        {(user.credit || 0).toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                    <div className="text-xs text-green-600 text-center">Credit</div>
                  </div>
                  <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium flex items-center touch-manipulation">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">{user.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium touch-manipulation"
                  >
                    <span className="hidden sm:inline">Đăng xuất</span>
                    <span className="sm:hidden">Thoát</span>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium touch-manipulation">
                    Đăng nhập
                  </Link>
                  <Link href="/auth/register" className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-blue-700 touch-manipulation">
                    Đăng ký
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <div className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Store className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-white" />
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
            Trở Thành Người Bán
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-green-100">
            Bắt đầu kinh doanh tài khoản số và tạo thu nhập từ hôm nay
          </p>
          {user ? (
            user.sellerRequest?.status === 'pending' ? (
              <div className="space-y-4">
                <div className="bg-yellow-100 text-yellow-800 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg border border-yellow-300">
                  <div className="flex items-center justify-center">
                    <div className="animate-pulse w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    Yêu cầu đang chờ duyệt
                  </div>
                  <p className="text-xs sm:text-sm mt-2 text-center">
                    {user.sellerRequest.personalInfo && user.sellerRequest.bankAccount 
                      ? 'Yêu cầu trở thành seller của bạn đang được xem xét bởi admin/manager'
                      : 'Vui lòng hoàn thiện thông tin cá nhân và tài khoản ngân hàng'}
                  </p>
                </div>
                <button
                  onClick={() => router.push('/become-seller/complete-info')}
                  className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg hover:bg-blue-700 transition-colors flex items-center mx-auto touch-manipulation"
                >
                  {user.sellerRequest.personalInfo && user.sellerRequest.bankAccount 
                    ? 'Xem/Cập nhật thông tin'
                    : 'Hoàn thiện thông tin'}
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            ) : user.sellerRequest?.status === 'rejected' ? (
              <div className="space-y-4">
                <div className="bg-red-100 text-red-800 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg border border-red-300">
                  <div className="flex items-center justify-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    Yêu cầu bị từ chối
                  </div>
                  {user.sellerRequest.note && (
                    <p className="text-xs sm:text-sm mt-2 text-center">
                      Lý do: {user.sellerRequest.note}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleUpgradeToSeller}
                  disabled={upgrading}
                  className="bg-white text-green-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto touch-manipulation"
                >
                  {upgrading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-green-600 mr-2"></div>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Gửi yêu cầu lại
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleUpgradeToSeller}
                disabled={upgrading}
                className="bg-white text-green-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto touch-manipulation"
              >
                {upgrading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-green-600 mr-2"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Gửi yêu cầu trở thành Seller</span>
                    <span className="sm:hidden">Trở thành Seller</span>
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                )}
              </button>
            )
          ) : (
            <Link href="/auth/register" className="bg-white text-green-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg hover:bg-gray-100 transition-colors inline-flex items-center touch-manipulation">
              Đăng ký ngay
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Tại Sao Nên Trở Thành Seller?</h2>
            <p className="text-base sm:text-lg text-gray-600">Những lợi ích khi bán hàng trên nền tảng của chúng tôi</p>
          </div>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
              <div className="bg-green-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Thu Nhập Cao</h3>
              <p className="text-sm sm:text-base text-gray-600">Kiếm tiền từ việc bán tài khoản số với tỷ suất lợi nhuận hấp dẫn</p>
            </div>
            
            <div className="text-center p-4 sm:p-6 bg-white rounded-lg shadow-sm border">
              <div className="bg-blue-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Khách Hàng Đông Đảo</h3>
              <p className="text-sm sm:text-base text-gray-600">Tiếp cận hàng nghìn khách hàng tiềm năng trên nền tảng</p>
            </div>
            
            <div className="text-center p-4 sm:p-6 bg-white rounded-lg shadow-sm border sm:col-span-2 md:col-span-1">
              <div className="bg-purple-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">An Toàn & Tin Cậy</h3>
              <p className="text-sm sm:text-base text-gray-600">Hệ thống bảo mật cao, giao dịch được đảm bảo an toàn</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">Tính Năng Dành Cho Seller</h2>
            <p className="text-base sm:text-lg text-gray-600">Công cụ mạnh mẽ để quản lý và phát triển kinh doanh</p>
          </div>
          
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Quản Lý Sản Phẩm</h3>
                <p className="text-sm sm:text-base text-gray-600">Dễ dàng thêm, chỉnh sửa và quản lý các sản phẩm tài khoản của bạn</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Theo Dõi Doanh Thu</h3>
                <p className="text-sm sm:text-base text-gray-600">Xem báo cáo chi tiết về doanh số và thu nhập của bạn</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Hỗ Trợ 24/7</h3>
                <p className="text-sm sm:text-base text-gray-600">Đội ngũ hỗ trợ luôn sẵn sàng giúp đỡ bạn mọi lúc</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 sm:space-x-4">
              <div className="bg-yellow-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Thanh Toán Nhanh</h3>
                <p className="text-sm sm:text-base text-gray-600">Nhận tiền ngay khi có giao dịch thành công</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Sẵn Sàng Bắt Đầu?</h2>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-gray-300">
            Tham gia cùng hàng nghìn seller thành công trên nền tảng
          </p>
          {user ? (
            <button
              onClick={handleUpgradeToSeller}
              disabled={upgrading}
              className="bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center touch-manipulation"
            >
              {upgrading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Trở Thành Seller Ngay</span>
                  <span className="sm:hidden">Trở Thành Seller</span>
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </>
              )}
            </button>
          ) : (
            <Link href="/auth/register" className="bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base md:text-lg hover:bg-green-700 transition-colors inline-flex items-center touch-manipulation">
              Đăng Ký Ngay
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          )}
        </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
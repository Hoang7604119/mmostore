'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Users, Shield, Star, LogOut, User } from 'lucide-react'
import { UserData } from '@/types/user'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LoadingSpinner from '@/components/LoadingSpinner'
import NotificationBanner from '@/components/NotificationBanner'
import { CONTACT_INFO } from '@/config/contact'
import { MESSAGES } from '@/config/messages'

interface UserWithCredit extends UserData {
  credit: number
}

export default function HomePage() {
  const [user, setUser] = useState<UserWithCredit | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const getDashboardLink = () => {
    if (!user) return '/dashboard'
    
    switch (user.role) {
      case 'admin':
        return '/dashboard/admin'
      case 'manager':
        return '/dashboard/manager'
      case 'seller':
        return '/dashboard/seller'
      case 'buyer':
        return '/dashboard/buyer'
      default:
        return '/dashboard'
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen flex flex-col">
      {user && <Header user={user} onLogout={handleLogout} />}
      
      {!user && (
        <header className="bg-gradient-to-r from-white via-blue-50/30 to-white shadow-xl border-b border-blue-100/50 backdrop-blur-xl">
          <div className="w-full px-4 sm:px-6">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center group transition-all duration-300 hover:scale-105 touch-manipulation">
                  <div className="relative">
                    <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 group-hover:text-blue-700 transition-all duration-300" />
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-600 transition-all duration-300 hidden xs:block">{CONTACT_INFO.COMPANY_NAME}</span>
                  <span className="ml-2 text-sm font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-600 transition-all duration-300 xs:hidden">MMO</span>
                </Link>
              </div>
              <nav className="flex items-center space-x-2 sm:space-x-3">
                <Link href="/marketplace" className="px-2 sm:px-4 py-2 text-gray-700 hover:text-gray-900 text-xs sm:text-sm font-semibold rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 border border-transparent hover:border-blue-100/50 hover:shadow-sm touch-manipulation">
                  <span className="hidden sm:inline">🛒 Marketplace</span>
                  <span className="sm:hidden">🛒</span>
                </Link>
                <Link href="/auth/login" className="px-2 sm:px-4 py-2 text-gray-700 hover:text-gray-900 text-xs sm:text-sm font-semibold rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 border border-transparent hover:border-blue-100/50 hover:shadow-sm touch-manipulation">
                  <span className="hidden sm:inline">🔑 Đăng nhập</span>
                  <span className="sm:hidden">🔑</span>
                </Link>
                <Link href="/auth/register" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 border border-blue-500/20 touch-manipulation">
                  <span className="hidden sm:inline">✨ Đăng ký</span>
                  <span className="sm:hidden">Đăng ký</span>
                </Link>
              </nav>
            </div>
          </div>
        </header>
      )}

      {/* Notification Banner */}
      <NotificationBanner />

      <div className="flex-1">
        {/* Hero Section - Modern & Clean */}
        <section className="relative bg-gradient-to-br from-white via-blue-50/50 to-indigo-100/80 py-12 sm:py-20 overflow-hidden">
        {/* Background decoration - Optimized for mobile */}
        <div className="absolute inset-0 bg-grid-slate-100/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-400/30 to-indigo-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-tr from-purple-400/30 to-pink-600/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-200/20 via-indigo-200/20 to-purple-200/20 rounded-full blur-3xl animate-spin" style={{animationDuration: '20s'}}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 tracking-tight">
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {MESSAGES.WELCOME.TITLE}
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-10 max-w-3xl mx-auto font-medium leading-relaxed px-4 sm:px-0">
              {MESSAGES.WELCOME.SUBTITLE}
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4 sm:px-0">
              <Link 
                href="/marketplace" 
                className="group relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 hover:scale-105 border border-blue-500/20 touch-manipulation"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2 sm:space-x-3">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Xem Marketplace</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              {user && user.role !== 'admin' && (
                user.role === 'buyer' && user.sellerRequest?.status === 'pending' ? (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 text-amber-800 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold shadow-lg backdrop-blur-sm flex items-center justify-center space-x-2 sm:space-x-3 touch-manipulation">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm sm:text-base">Yêu cầu đang chờ duyệt</span>
                  </div>
                ) : (
                  <Link 
                    href={
                      user.role === 'buyer' 
                        ? '/become-seller' 
                        : user.role === 'seller' || user.role === 'manager'
                          ? '/dashboard/seller'
                          : '/become-seller'
                    } 
                    className="group relative bg-white/90 backdrop-blur-xl border border-gray-200/50 text-gray-700 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold hover:bg-white hover:shadow-2xl hover:shadow-gray-500/10 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 touch-manipulation"
                  >
                    <span className="flex items-center justify-center space-x-2 sm:space-x-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM16 10h.01M12 14h.01M8 14h.01M8 10h.01" />
                      </svg>
                      <span className="text-sm sm:text-base">Bắt Đầu Bán</span>
                    </span>
                  </Link>
                )
              )}
              {!user && (
                <Link 
                  href="/auth/register" 
                  className="group relative bg-white/90 backdrop-blur-xl border border-gray-200/50 text-gray-700 px-6 sm:px-10 py-3 sm:py-4 rounded-2xl font-bold hover:bg-white hover:shadow-2xl hover:shadow-gray-500/10 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 touch-manipulation"
                >
                  <span className="flex items-center justify-center space-x-2 sm:space-x-3">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-sm sm:text-base">Đăng Ký Để Bán</span>
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-20 bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 relative overflow-hidden">
        {/* Background decorations - Optimized for mobile */}
        <div className="absolute top-10 left-10 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 sm:w-40 sm:h-40 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4 sm:mb-6">
              Tại Sao Chọn Chúng Tôi?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Chúng tôi cung cấp nền tảng an toàn, đáng tin cậy cho việc mua bán trực tuyến với những tính năng vượt trội
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group text-center p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-white/50 transition-all duration-500 hover:-translate-y-2 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Shield className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors duration-300">An Toàn & Bảo Mật</h3>
              <p className="text-gray-600 leading-relaxed">Hệ thống bảo mật cao cấp với mã hóa end-to-end, đảm bảo thông tin và giao dịch của bạn luôn được bảo vệ tuyệt đối</p>
            </div>
            
            <div className="group text-center p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-white/50 transition-all duration-500 hover:-translate-y-2 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Users className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-green-700 transition-colors duration-300">Cộng Đồng Lớn</h3>
              <p className="text-gray-600 leading-relaxed">Hàng nghìn người mua và bán tích cực từ khắp nơi, tạo nên một thị trường sôi động và đa dạng với cơ hội vô tận</p>
            </div>
            
            <div className="group text-center p-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl hover:shadow-2xl border border-white/50 transition-all duration-500 hover:-translate-y-2 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Star className="h-10 w-10 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-yellow-700 transition-colors duration-300">Chất Lượng Cao</h3>
              <p className="text-gray-600 leading-relaxed">Quy trình kiểm duyệt nghiêm ngặt với AI và chuyên gia, đảm bảo chỉ những sản phẩm chất lượng cao nhất được phép bán</p>
            </div>
          </div>
        </div>
        </section>
      </div>

      <Footer />
    </div>
  )
}
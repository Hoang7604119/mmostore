'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  ShoppingCart, 
  LogOut, 
  Home,
  Users,
  Package,
  ShoppingBag,
  Store,
  Settings,
  Shield,
  UserCheck,
  Plus,
  Tags,
  CheckCircle,
  Heart,
  Star,
  User,
  Menu,
  X
} from 'lucide-react'
import { UserData } from '@/types/user'
import NotificationIcon from './NotificationIcon'
import MessageIcon from './MessageIcon'
import { CONTACT_INFO } from '@/config/contact'

interface UserWithCredit extends UserData {
  credit: number
}

interface HeaderProps {
  user: UserWithCredit
  onLogout: () => void
}

export default function Header({ user, onLogout }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown when route changes
  useEffect(() => {
    setIsDropdownOpen(false)
  }, [pathname])

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Trang chủ',
        href: '/',
        icon: Home,
        roles: ['admin', 'manager', 'seller', 'buyer']
      },
      {
        name: 'Hồ sơ',
        href: `/dashboard/${user?.role || 'buyer'}/profile`,
        icon: User,
        roles: ['admin', 'manager', 'seller', 'buyer']
      },
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: ShoppingCart,
        roles: ['admin', 'manager', 'seller', 'buyer']
      },
      {
        name: 'Marketplace',
        href: '/marketplace',
        icon: ShoppingBag,
        roles: ['admin', 'manager', 'seller', 'buyer']
      }
    ]

    const roleSpecificItems = {
      admin: [
        {
          name: 'Quản lý Users',
          href: '/dashboard/admin/users',
          icon: Users
        },
        {
          name: 'Quản lý Sản phẩm',
          href: '/dashboard/admin/products',
          icon: Package
        },
        {
          name: 'Loại sản phẩm',
          href: '/dashboard/admin/product-types',
          icon: Tags
        },
        {
          name: 'Tạo sản phẩm',
          href: '/dashboard/admin/products/create',
          icon: Plus
        }
      ],
      manager: [
        {
          name: 'Quản lý Users',
          href: '/dashboard/manager/users',
          icon: UserCheck
        },
        {
          name: 'Quản lý Sản phẩm',
          href: '/dashboard/manager/products',
          icon: Package
        },
        {
          name: 'Tạo sản phẩm',
          href: '/dashboard/manager/products/create',
          icon: Plus
        },
        {
          name: 'Đơn hàng',
          href: '/dashboard/buyer/orders',
          icon: ShoppingCart
        }
      ],
      seller: [
        {
          name: 'Sản phẩm của tôi',
          href: '/dashboard/seller/products',
          icon: Store
        },
        {
          name: 'Tạo sản phẩm',
          href: '/dashboard/seller/products/create',
          icon: Plus
        },
        {
          name: 'Đơn hàng',
          href: '/dashboard/buyer/orders',
          icon: ShoppingCart
        }
      ],
      buyer: [
        {
          name: 'Marketplace',
          href: '/dashboard/buyer/marketplace',
          icon: ShoppingBag
        },
        {
          name: 'Đơn hàng',
          href: '/dashboard/buyer/orders',
          icon: Package
        },
        {
          name: 'Yêu thích',
          href: '/dashboard/buyer/wishlist',
          icon: Heart
        }
      ]
    }

    return [...baseItems, ...(roleSpecificItems[(user?.role || 'buyer') as keyof typeof roleSpecificItems] || [])]
  }

  const navigationItems = getNavigationItems()

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-purple-100 text-purple-800'
      case 'seller': return 'bg-green-100 text-green-800'
      case 'buyer': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
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

  return (
    <header className="bg-gradient-to-r from-white via-blue-50/30 to-white backdrop-blur-xl shadow-xl border-b border-blue-100/50 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group hover:scale-105 transition-all duration-300">
              <div className="relative">
                <img 
                  src="/favicon.svg" 
                  alt="MMO Store Logo" 
                  className="h-6 w-6 sm:h-8 sm:w-8 group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg group-hover:bg-blue-500/30 transition-all duration-300"></div>
              </div>
              <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-300 hidden xs:block">{CONTACT_INFO.COMPANY_NAME}</span>
              <span className="ml-2 text-sm font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-300 xs:hidden">MMO</span>
            </Link>
          </div>

          {/* User Info & Navigation Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden lg:flex items-center space-x-3">
              <span className="text-sm font-medium bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent">Xin chào, {user?.username || 'Guest'}</span>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border sm:backdrop-blur-sm ${getRoleColor(user?.role || 'buyer')}`}>
                    {getRoleDisplayName(user?.role || 'buyer')}
              </span>
            </div>
            
            {/* Message and Notification Icons */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <MessageIcon userId={user?._id || ''} />
              <NotificationIcon userId={user?._id || ''} />
            </div>
            
            {/* Dropdown Menu Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-white to-blue-50/50 text-gray-700 hover:text-gray-900 hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 shadow-sm border border-gray-200/50 backdrop-blur-sm hover:shadow-md hover:scale-105 touch-manipulation"
                title="Menu điều hướng"
              >
                {isDropdownOpen ? (
                  <X className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 rotate-90" />
                ) : (
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300" />
                )}
                <span className="text-xs sm:text-sm font-semibold hidden xs:block">Menu</span>
              </button>

              {/* Dropdown Menu - Modern & Clean */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-gradient-to-br from-white via-blue-50/30 to-white sm:backdrop-blur-sm rounded-3xl shadow-2xl border border-blue-100/50 py-4 z-[70] animate-in slide-in-from-top-2 duration-300 max-h-[85vh] overflow-y-auto">
                  {/* Mobile User Info - Only visible on mobile */}
                  <div className="sm:hidden px-4 py-3 border-b border-gradient-to-r from-transparent via-blue-100/50 to-transparent">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${getRoleColor(user?.role || 'buyer').replace('bg-', 'bg-')}`}>
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{user?.username || 'Guest'}</div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold shadow-sm border sm:backdrop-blur-sm ${getRoleColor(user?.role || 'buyer')}`}>
                          {getRoleDisplayName(user?.role || 'buyer')}
                        </span>
                      </div>
                    </div>
                  </div>



                  {/* Credit Display */}
                  <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gradient-to-r from-transparent via-blue-100/50 to-transparent">
                    <Link href="/dashboard/credit" className="block">
                      <div className="bg-gradient-to-br from-emerald-50 via-green-50/50 to-emerald-50 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl border border-emerald-200/50 hover:from-emerald-100 hover:via-green-100/50 hover:to-emerald-100 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-lg touch-manipulation">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="relative">
                              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full animate-pulse shadow-md"></div>
                              <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-sm animate-pulse"></div>
                            </div>
                            <span className="text-emerald-800 font-bold text-sm sm:text-base bg-gradient-to-r from-emerald-800 to-green-700 bg-clip-text text-transparent">
                              {(user.credit || 0).toLocaleString('vi-VN')} Credit
                            </span>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="text-xs text-emerald-700 mt-2 font-semibold opacity-80">💰 Nhấn để quản lý tài khoản</div>
                      </div>
                    </Link>
                  </div>
                  
                  {/* Navigation Items */}
                  <div className="px-4 py-3 space-y-1">
                    {navigationItems.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center space-x-3 sm:space-x-4 px-4 sm:px-5 py-3 sm:py-3.5 text-sm rounded-2xl transition-all duration-300 group border border-transparent hover:shadow-sm touch-manipulation ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border-blue-200/50'
                              : 'text-gray-700 hover:text-gray-900 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 hover:border-blue-100/50'
                          }`}
                        >
                          <div className="relative">
                            <Icon className={`h-5 w-5 transition-all duration-300 group-hover:scale-110 ${
                              isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                            }`} />
                            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          <span className="font-semibold group-hover:text-gray-900">{item.name}</span>
                          {isActive ? (
                            <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></div>
                          ) : (
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                  
                  {/* Logout Button */}
                  <div className="px-4 pt-3 border-t border-gradient-to-r from-transparent via-red-100/30 to-transparent">
                    <button
                      onClick={onLogout}
                      className="flex items-center space-x-3 sm:space-x-4 w-full px-4 sm:px-5 py-3 sm:py-3.5 text-red-600 hover:text-red-700 hover:bg-gradient-to-r hover:from-red-50/50 hover:to-pink-50/50 rounded-2xl transition-all duration-300 group border border-transparent hover:border-red-100/50 hover:shadow-sm touch-manipulation"
                    >
                      <div className="relative">
                        <LogOut className="h-5 w-5 group-hover:scale-110 transition-all duration-300 group-hover:text-red-600" />
                        <div className="absolute inset-0 bg-red-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <span className="text-sm font-semibold group-hover:text-red-700">🚪 Đăng xuất</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </header>
  )
}
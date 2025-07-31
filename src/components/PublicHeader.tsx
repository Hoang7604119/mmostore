'use client'

import Link from 'next/link'
import { ShoppingCart, User, LogIn, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function PublicHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MM</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">MMO Store</span>
            <span className="text-lg font-bold text-gray-900 sm:hidden">MMO</span>
          </Link>

          {/* Navigation - Hidden on mobile, shown on tablet+ */}
          <nav className="hidden lg:flex space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors touch-manipulation">
              Trang chủ
            </Link>
            <Link href="/marketplace" className="text-gray-600 hover:text-gray-900 transition-colors touch-manipulation">
              Marketplace
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors touch-manipulation">
              Liên hệ
            </Link>
            <Link href="/faq" className="text-gray-600 hover:text-gray-900 transition-colors touch-manipulation">
              FAQ
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>

          {/* Auth Buttons - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 transition-colors touch-manipulation"
            >
              Đăng nhập
            </Link>
            <Link
              href="/auth/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
            >
              Đăng ký
            </Link>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4 space-y-4">
            {/* Navigation Links */}
            <div className="space-y-2">
              <Link 
                href="/" 
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors touch-manipulation"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Trang chủ
              </Link>
              <Link 
                href="/marketplace" 
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors touch-manipulation"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Marketplace
              </Link>
              <Link 
                href="/contact" 
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors touch-manipulation"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Liên hệ
              </Link>
              <Link 
                href="/faq" 
                className="block px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors touch-manipulation"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQ
              </Link>
            </div>
            
            {/* Auth Buttons - Mobile */}
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <Link
                href="/auth/login"
                className="block w-full text-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors touch-manipulation"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Đăng nhập
              </Link>
              <Link
                href="/auth/register"
                className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Đăng ký
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
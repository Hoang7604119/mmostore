'use client'

import Link from 'next/link'
import { ShoppingCart, Shield } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white py-12 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-pulse"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-400" />
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                MMO Store
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Nền tảng mua bán tài khoản số uy tín hàng đầu Việt Nam. Kết nối người mua và người bán một cách an toàn, minh bạch.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-4">Liên kết nhanh</h4>
            <ul className="space-y-2">
              <li><Link href="/marketplace" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-2"><ShoppingCart className="w-4 h-4" /><span>Marketplace</span></Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg><span>Liên hệ</span></Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white mb-4">Hỗ trợ</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span>Điều khoản sử dụng</span></Link></li>
              <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-2"><Shield className="w-4 h-4" /><span>Chính sách bảo mật</span></Link></li>
              <li><Link href="/faq" className="text-gray-300 hover:text-white transition-colors duration-200 text-sm flex items-center space-x-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>FAQ</span></Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700/50 mt-8 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 MMO Store. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  )
}
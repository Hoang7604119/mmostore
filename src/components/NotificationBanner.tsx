'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import { APP_CONFIG } from '@/config/app'

interface NotificationBannerProps {
  className?: string
}

const NotificationBanner = ({ className = '' }: NotificationBannerProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Kiểm tra xem banner có được bật không
    if (!APP_CONFIG.BANNER.ENABLED) return

    // Kiểm tra localStorage xem user đã dismiss chưa
    const dismissed = localStorage.getItem('banner-dismissed')
    if (dismissed === 'true') {
      setIsDismissed(true)
      return
    }

    setIsVisible(true)

    // Auto hide nếu có cấu hình
    if (APP_CONFIG.BANNER.AUTO_HIDE_AFTER_MS) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, APP_CONFIG.BANNER.AUTO_HIDE_AFTER_MS)

      return () => clearTimeout(timer)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    if (APP_CONFIG.BANNER.DISMISSIBLE) {
      localStorage.setItem('banner-dismissed', 'true')
      setIsDismissed(true)
    }
  }

  // Không hiển thị nếu banner bị tắt hoặc đã dismiss
  if (!APP_CONFIG.BANNER.ENABLED || isDismissed || !isVisible) {
    return null
  }

  // Icon theo type
  const getIcon = () => {
    switch (APP_CONFIG.BANNER.TYPE) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />
      case 'warning':
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-600" />
    }
  }

  // Màu sắc theo type
  const getColorClasses = () => {
    switch (APP_CONFIG.BANNER.TYPE) {
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
      default:
        return 'bg-amber-50 border-amber-200 text-amber-800'
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className={`
        ${getColorClasses()}
        border-b px-4 py-2 text-sm overflow-hidden
        transition-all duration-300 ease-in-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}
      `}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Scrolling text container */}
          <div className="flex-1 overflow-hidden mr-4">
            <div className="whitespace-nowrap">
              <div className="inline-block animate-marquee">
                <span className="font-medium">
                  {APP_CONFIG.BANNER.MESSAGE}
                </span>
              </div>
            </div>
          </div>
          
          {/* Fixed close button */}
          {APP_CONFIG.BANNER.DISMISSIBLE && (
            <button
              onClick={handleDismiss}
              className="
                flex-shrink-0 p-1 rounded-md
                hover:bg-black/10 transition-colors
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current
              "
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Custom CSS for marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100vw);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-marquee {
          animation: marquee 15s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default NotificationBanner
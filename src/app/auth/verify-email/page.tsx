'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import VerificationCodeInput from '@/components/auth/VerificationCodeInput'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Home } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    } else {
      // If no email in URL, redirect to register
      router.push('/auth/register')
    }
  }, [searchParams, router])

  const handleVerificationSuccess = (code: string) => {
    // Store verification info in sessionStorage for register page
    sessionStorage.setItem('verifiedEmail', email)
    sessionStorage.setItem('verificationCode', code)
    
    // Redirect back to register page
    router.push('/auth/register?verified=true')
  }

  const handleResendCode = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        return true
      } else {
        setError(data.error || 'Không thể gửi lại mã')
        return false
      }
    } catch (error) {
      setError('Lỗi kết nối, vui lòng thử lại')
      return false
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/auth/register" className="flex items-center text-gray-600 hover:text-gray-900 touch-manipulation">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">Quay lại</span>
            </Link>
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900 touch-manipulation">
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            {/* Logo */}
            <div className="text-center mb-6 sm:mb-8">
              <Link href="/" className="inline-block touch-manipulation">
                <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">MMO Store</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Nền tảng mua bán tài khoản game</p>
              </Link>
            </div>

            {/* Verification Form */}
            <VerificationCodeInput
              email={email}
              onVerificationSuccess={handleVerificationSuccess}
              onResendCode={handleResendCode}
              isLoading={isLoading}
              error={error}
            />

            {/* Help Section */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
              <div className="text-center space-y-2">
                <p className="text-xs sm:text-sm text-gray-600">
                  Cần thay đổi email?
                </p>
                <Link 
                  href="/auth/register" 
                  className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium touch-manipulation"
                >
                  Quay lại trang đăng ký
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 sm:mt-8">
            <p className="text-xs sm:text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 font-medium touch-manipulation">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
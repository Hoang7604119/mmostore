'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShoppingCart, Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react'
import PasswordStrengthIndicator from '@/components/auth/PasswordStrengthIndicator'
import { validatePassword } from '@/lib/passwordValidation'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<'register'>('register')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Generate strong password
  const generateStrongPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    let password = ''
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]
    
    // Fill the rest randomly (minimum 12 characters total)
    const allChars = lowercase + uppercase + numbers + symbols
    for (let i = 4; i < 16; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword()
    setFormData(prev => ({
      ...prev,
      password: newPassword,
      confirmPassword: newPassword
    }))
  }


  // Auto complete registration after email verification
  const handleAutoCompleteRegistration = async (email: string, code: string, username: string, password: string) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
          verificationCode: code
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Đăng ký thành công! Đang chuyển hướng...')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      } else {
        setError(data.error || 'Có lỗi xảy ra')
        // If registration fails, show the form again
        setFormData({
          username: username,
          email: email,
          password: password,
          confirmPassword: password
        })
      }
    } catch (error) {
      setError('Lỗi kết nối, vui lòng thử lại')
      // If registration fails, show the form again
      setFormData({
        username: username,
        email: email,
        password: password,
        confirmPassword: password
      })
    } finally {
      setLoading(false)
    }
  }

  // Check if returning from verification page
  useEffect(() => {
    const verified = searchParams.get('verified')
    const storedEmail = sessionStorage.getItem('verifiedEmail')
    const storedCode = sessionStorage.getItem('verificationCode')
    const storedUsername = sessionStorage.getItem('registrationUsername')
    const storedPassword = sessionStorage.getItem('registrationPassword')
    
    if (verified === 'true' && storedEmail && storedCode && storedUsername && storedPassword) {
      // Auto complete registration
      handleAutoCompleteRegistration(storedEmail, storedCode, storedUsername, storedPassword)
      
      // Clear session storage
      sessionStorage.removeItem('verifiedEmail')
      sessionStorage.removeItem('verificationCode')
      sessionStorage.removeItem('registrationUsername')
      sessionStorage.removeItem('registrationPassword')
    }
  }, [searchParams])

  // Send verification email
  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate all fields
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Email không hợp lệ')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }

    // Validate password strength
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0])
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Mã xác thực đã được gửi đến email của bạn')
        
        // Store registration data in session storage
        sessionStorage.setItem('registrationUsername', formData.username)
        sessionStorage.setItem('registrationPassword', formData.password)
        
        // Redirect to verification page
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        setError(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      setError('Lỗi kết nối, vui lòng thử lại')
    } finally {
      setLoading(false)
    }
  }



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-white via-blue-50/30 to-white shadow-xl border-b border-blue-100/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group transition-all duration-300 hover:scale-105 touch-manipulation">
                <div className="relative">
                  <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 group-hover:text-blue-700 transition-all duration-300" />
                  <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <span className="ml-2 sm:ml-3 text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-600 transition-all duration-300">
                  <span className="hidden sm:inline">MMO Store</span>
                  <span className="sm:hidden">MMO</span>
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link href="/marketplace" className="px-2 sm:px-4 py-2 text-gray-700 hover:text-gray-900 text-xs sm:text-sm font-semibold rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 border border-transparent hover:border-blue-100/50 hover:shadow-sm touch-manipulation">
                <span className="hidden sm:inline">🛒 Marketplace</span>
                <span className="sm:hidden">🛒</span>
              </Link>
              <Link href="/auth/login" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 border border-blue-500/20 touch-manipulation">
                <span className="hidden sm:inline">🔑 Đăng nhập</span>
                <span className="sm:hidden">🔑</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          {/* Form Header */}
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Đăng ký</h2>
            <p className="mt-2 text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500 touch-manipulation">
                Đăng nhập ngay
              </Link>
            </p>
          </div>

          {/* Form */}
          <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
            {/* Step 1: Registration Form */}
            {step === 'register' && (
              <form onSubmit={handleSendVerification} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      Tên đăng nhập
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                      placeholder="Nhập tên đăng nhập"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm touch-manipulation"
                      placeholder="Nhập địa chỉ email"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Mật khẩu
                    </label>
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={formData.password}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 text-sm touch-manipulation"
                          placeholder="Nhập mật khẩu (ít nhất 12 ký tự)"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center touch-manipulation"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      
                      {/* Generate Password Button */}
                      <button
                        type="button"
                        onClick={handleGeneratePassword}
                        className="w-full flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors touch-manipulation"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tạo mật khẩu mạnh
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-3">
                        <PasswordStrengthIndicator password={formData.password} />
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 text-sm touch-manipulation"
                        placeholder="Nhập lại mật khẩu"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center touch-manipulation"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 sm:py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi mã xác thực...
                    </>
                  ) : (
                    'Tiếp tục đăng ký'
                  )}
                </button>
              </form>
            )}


          </div>

          {/* Back to home */}
          <div className="text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 touch-manipulation">
              ← Quay về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
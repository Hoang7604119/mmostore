'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, RefreshCw } from 'lucide-react'

interface VerificationCodeInputProps {
  email: string
  onVerificationSuccess: (code: string) => void
  onResendCode?: () => Promise<boolean>
  isLoading?: boolean
  error?: string
  className?: string
}

export default function VerificationCodeInput({
  email,
  onVerificationSuccess,
  onResendCode,
  isLoading = false,
  error,
  className = ''
}: VerificationCodeInputProps) {
  const [code, setCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [timeLeft])

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Handle code input change
  const handleCodeChange = (value: string, index: number) => {
    const newCode = code.split('')
    newCode[index] = value
    const updatedCode = newCode.join('')
    
    setCode(updatedCode)
    setVerificationError('')
    
    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    
    // Auto verify when all 6 digits entered
    if (updatedCode.length === 6) {
      handleVerifyCode(updatedCode)
    }
  }

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent, index: number) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6)
    
    if (digits.length > 0) {
      const newCode = digits.padEnd(6, '').split('')
      setCode(digits)
      setVerificationError('')
      
      // Fill all inputs with the pasted digits
      newCode.forEach((digit, i) => {
        if (i < 6 && inputRefs.current[i]) {
          inputRefs.current[i]!.value = digit || ''
        }
      })
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(digits.length, 5)
      inputRefs.current[nextIndex]?.focus()
      
      // Auto verify if we have 6 digits
      if (digits.length === 6) {
        handleVerifyCode(digits)
      }
    }
  }

  // Handle backspace
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Verify code
  const handleVerifyCode = async (codeToVerify: string = code) => {
    if (codeToVerify.length !== 6) {
      setVerificationError('Vui lòng nhập đầy đủ 6 chữ số')
      return
    }

    setIsVerifying(true)
    setVerificationError('')

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: codeToVerify
        })
      })

      const data = await response.json()

      if (response.ok && data.verified) {
        onVerificationSuccess(codeToVerify)
      } else {
        setVerificationError(data.error || 'Mã xác thực không đúng')
        setCode('')
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      setVerificationError('Lỗi kết nối, vui lòng thử lại')
    } finally {
      setIsVerifying(false)
    }
  }

  // Resend code
  const handleResendCode = async () => {
    if (!onResendCode || !canResend) return

    setIsResending(true)
    setVerificationError('')

    try {
      const success = await onResendCode()
      if (success) {
        setTimeLeft(600) // Reset timer
        setCanResend(false)
        setCode('')
        inputRefs.current[0]?.focus()
      } else {
        setVerificationError('Không thể gửi lại mã. Vui lòng thử lại.')
      }
    } catch (error) {
      setVerificationError('Lỗi kết nối, vui lòng thử lại')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Xác thực email
        </h2>
        <p className="text-gray-600">
          Chúng tôi đã gửi mã xác thực 6 chữ số đến
        </p>
        <p className="font-medium text-gray-900">{email}</p>
      </div>

      {/* Code Input */}
      <div className="space-y-4">
        <div className="flex justify-center space-x-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={code[index] || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '')
                handleCodeChange(value, index)
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={(e) => handlePaste(e, index)}
              className="w-12 h-12 text-center text-xl font-bold border-2 focus:border-blue-500"
              disabled={isVerifying || isLoading}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="text-center">
          {timeLeft > 0 ? (
            <p className="text-sm text-gray-600">
              Mã có hiệu lực trong <span className="font-medium text-blue-600">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <p className="text-sm text-red-600">
              Mã đã hết hạn. Vui lòng yêu cầu mã mới.
            </p>
          )}
        </div>
      </div>

      {/* Error Display */}
      {(error || verificationError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {error || verificationError}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <Button
          onClick={() => handleVerifyCode()}
          disabled={code.length !== 6 || isVerifying || isLoading}
          className="w-full"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang xác thực...
            </>
          ) : (
            'Xác thực'
          )}
        </Button>

        {onResendCode && (
          <Button
            variant="outline"
            onClick={handleResendCode}
            disabled={!canResend || isResending || isLoading}
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Gửi lại mã
              </>
            )}
          </Button>
        )}
      </div>

      {/* Help Text */}
      <div className="text-center text-sm text-gray-600">
        <p>Không nhận được mã?</p>
        <p>Kiểm tra thư mục spam hoặc {canResend ? 'nhấn gửi lại mã' : 'đợi để gửi lại'}.</p>
      </div>
    </div>
  )
}
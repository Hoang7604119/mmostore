'use client'

import { useMemo } from 'react'
import { validatePassword, getPasswordStrength, getPasswordStrengthText, getPasswordStrengthColor } from '@/lib/passwordValidation'
import { Check, X } from 'lucide-react'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

export default function PasswordStrengthIndicator({ password, className = '' }: PasswordStrengthIndicatorProps) {
  const validation = useMemo(() => validatePassword(password), [password])
  const strength = useMemo(() => getPasswordStrength(password), [password])
  const strengthText = useMemo(() => getPasswordStrengthText(password), [password])
  const strengthColor = useMemo(() => getPasswordStrengthColor(password), [password])

  if (!password) return null

  const requirements = [
    {
      text: 'Ít nhất 12 ký tự',
      met: password.length >= 12
    },
    {
      text: 'Có chữ hoa (A-Z)',
      met: /[A-Z]/.test(password)
    },
    {
      text: 'Có chữ thường (a-z)',
      met: /[a-z]/.test(password)
    },
    {
      text: 'Có số (0-9)',
      met: /\d/.test(password)
    },
    {
      text: 'Có ký tự đặc biệt (!@#$%...)',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    }
  ]

  const getStrengthBarColor = () => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'strong':
        return 'bg-green-500'
      default:
        return 'bg-gray-300'
    }
  }

  const getStrengthBarWidth = () => {
    switch (strength) {
      case 'weak':
        return 'w-1/3'
      case 'medium':
        return 'w-2/3'
      case 'strong':
        return 'w-full'
      default:
        return 'w-0'
    }
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Độ mạnh mật khẩu:</span>
          <span className={`text-sm font-medium ${strengthColor}`}>
            {strengthText}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor()} ${getStrengthBarWidth()}`}
          />
        </div>
      </div>

      {/* Requirements List */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Yêu cầu mật khẩu:</p>
        <div className="space-y-1">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center space-x-2">
              {req.met ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${
                req.met ? 'text-green-700' : 'text-red-700'
              }`}>
                {req.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Errors */}
      {!validation.isValid && validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              • {error}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

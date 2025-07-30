// Password validation utilities

export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

// Validate password strength
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []
  
  // Check minimum length (12 characters)
  if (password.length < 12) {
    errors.push('Mật khẩu phải có ít nhất 12 ký tự')
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ hoa')
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ thường')
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ số')
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Get password strength level
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  let score = 0
  
  if (password.length >= 12) score++
  if (password.length >= 16) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++
  if (password.length >= 20) score++
  
  if (score <= 3) return 'weak'
  if (score <= 5) return 'medium'
  return 'strong'
}

// Generate password strength indicator text
export function getPasswordStrengthText(password: string): string {
  const strength = getPasswordStrength(password)
  
  switch (strength) {
    case 'weak':
      return 'Yếu'
    case 'medium':
      return 'Trung bình'
    case 'strong':
      return 'Mạnh'
    default:
      return ''
  }
}

// Generate password strength color
export function getPasswordStrengthColor(password: string): string {
  const strength = getPasswordStrength(password)
  
  switch (strength) {
    case 'weak':
      return 'text-red-500'
    case 'medium':
      return 'text-yellow-500'
    case 'strong':
      return 'text-green-500'
    default:
      return 'text-gray-400'
  }
}
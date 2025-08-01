import { Resend } from 'resend'
import { EMAIL_CONFIG, generateVerificationCode as generateCode } from '@/config/email'

const resend = new Resend(EMAIL_CONFIG.API_KEY)

// Generate 6-digit verification code
export function generateVerificationCode(): string {
  return generateCode()
}

// Send verification email
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    const template = EMAIL_CONFIG.TEMPLATES.VERIFICATION
    
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.FROM_ADDRESSES.AUTH,
      to: [email],
      subject: template.subject,
      html: template.getHtml(code),
      text: template.getText(code),
    })

    if (error) {
      console.error('Email sending error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email service error:', error)
    return false
  }
}

// Validate verification code format
export function isValidVerificationCode(code: string): boolean {
  return /^\d{6}$/.test(code)
}
import { Resend } from 'resend'

const resend = new Resend('re_3Pyudgk6_7TBDFAJP4vVi5VeSKXiaB3bs')

// Generate 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send verification email
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    const { data, error } = await resend.emails.send({
      from: 'MMO Store <noreply@mmostore.site>',
      to: [email],
      subject: 'Mã xác thực đăng ký tài khoản - MMO Store',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">MMO Store</h1>
            <p style="color: #6b7280; margin: 5px 0;">Nền tảng mua bán tài khoản game và dịch vụ MMO</p>
          </div>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 30px; text-align: center;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Mã xác thực đăng ký</h2>
            <p style="color: #4b5563; margin-bottom: 30px;">Vui lòng sử dụng mã xác thực dưới đây để hoàn tất đăng ký tài khoản:</p>
            
            <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px;">${code}</span>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">Mã này có hiệu lực trong 10 phút.</p>
            <p style="color: #6b7280; font-size: 14px;">Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">© 2024 MMO Store. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      `,
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

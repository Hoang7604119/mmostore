// Email configuration for Resend
// Following Resend best practices: https://resend.com/docs/send-with-nextjs

export const EMAIL_CONFIG = {
  // Resend API configuration
  API_KEY: process.env.RESEND_API_KEY || 're_3Pyudgk6_7TBDFAJP4vVi5VeSKXiaB3bs',
  
  // Use subdomain for better deliverability and reputation management
  FROM_ADDRESSES: {
    AUTH: process.env.FROM_EMAIL_AUTH || 'MMO Store <auth@mail.mmostore.site>',
    NOTIFICATIONS: process.env.FROM_EMAIL_NOTIFICATIONS || 'MMO Store <notifications@mail.mmostore.site>',
    SUPPORT: process.env.FROM_EMAIL_SUPPORT || 'MMO Store <support@mail.mmostore.site>',
    ORDERS: process.env.FROM_EMAIL_ORDERS || 'MMO Store <orders@mail.mmostore.site>',
  },
  
  // Email templates with both HTML and plain text versions
  TEMPLATES: {
    VERIFICATION: {
      subject: 'Mã xác thực đăng ký tài khoản - MMO Store',
      getHtml: (code: string) => `
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
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">Email này được gửi tự động, vui lòng không trả lời.</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">© 2024 MMO Store. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      `,
      getText: (code: string) => `
MMO Store
Nền tảng mua bán tài khoản game và dịch vụ MMO

Mã xác thực đăng ký

Vui lòng sử dụng mã xác thực dưới đây để hoàn tất đăng ký tài khoản:

${code}

Mã này có hiệu lực trong 10 phút.

Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.

Email này được gửi tự động, vui lòng không trả lời.
© 2024 MMO Store. Tất cả quyền được bảo lưu.
      `
    }
  },
  
  // Common email settings
  SETTINGS: {
    VERIFICATION_CODE_EXPIRY: 10 * 60 * 1000, // 10 minutes
    MAX_ATTEMPTS: 5,
  }
}

// Email validation helper
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
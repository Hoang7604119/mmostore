// Cấu hình ứng dụng - dễ dàng thay đổi
export const APP_CONFIG = {
  // Thông tin ứng dụng
  APP_NAME: 'MMO Store',
  APP_VERSION: '1.0.0',
  APP_DESCRIPTION: 'Nền tảng mua bán tài khoản game và dịch vụ MMO',
  
  // URL và domain
  DOMAIN: 'mmostore.site',
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://mmostore.site' 
    : 'http://localhost:3000',
  
  // Cài đặt phí và hoa hồng
  FEES: {
    TRANSACTION_FEE_PERCENT: 2, // 5% phí giao dịch
    MIN_TRANSACTION_FEE: 1000, // Phí tối thiểu 1,000 VND
    MAX_TRANSACTION_FEE: 100000, // Phí tối đa 100,000 VND
    WITHDRAWAL_FEE: 0, // Phí rút tiền 5,000 VND
    MIN_WITHDRAWAL: 50000, // Số tiền rút tối thiểu 50,000 VND
  },
  
  // Giới hạn hệ thống
  LIMITS: {
    MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_PRODUCTS_PER_USER: 100,
    MAX_ORDERS_PER_DAY: 50,
    MAX_CREDIT_BALANCE: 10000000, // 10 triệu VND
    MIN_PRODUCT_PRICE: 1000, // 1,000 VND
    MAX_PRODUCT_PRICE: 1000000, // 1 triệu VND
  },
  
  // Cài đặt bảo mật
  SECURITY: {
    JWT_EXPIRES_IN: '7d',
    PASSWORD_MIN_LENGTH: 6,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 phút
  },
  
  // Cài đặt email
  EMAIL: {
    FROM_NAME: 'MMO Store',
    REPLY_TO: 'notifications@mail.mmostore.site',
    SUPPORT_EMAIL: 'support@mail.mmostore.site'
  },
  
  // Cài đặt thông báo
  NOTIFICATIONS: {
    ENABLE_EMAIL_NOTIFICATIONS: true,
    ENABLE_SMS_NOTIFICATIONS: false,
    ENABLE_PUSH_NOTIFICATIONS: true,
    AUTO_DELETE_AFTER_DAYS: 30
  },

  // Cài đặt banner thông báo
  BANNER: {
    ENABLED: true,
    MESSAGE: 'Website đang trong quá trình thử nghiệm và phát triển chưa đi vào hoạt động chính thức, mọi sản phẩm đều là minh họa.',
    TYPE: 'warning', // 'info', 'warning', 'error', 'success'
    DISMISSIBLE: true,
    AUTO_HIDE_AFTER_MS: null // null = không tự ẩn, số = milliseconds
  },
  
  // Cài đặt sản phẩm
  PRODUCTS: {
    FEATURED_DURATION_DAYS: 7,
    AUTO_APPROVE_PRODUCTS: false,
    REQUIRE_PRODUCT_VERIFICATION: true,
    DEFAULT_PRODUCT_STATUS: 'pending',
    // Hình ảnh mặc định cho từng loại sản phẩm
    DEFAULT_IMAGES: {
      'gmail': '/uploads/1753289016691_gmail.png',
      'facebook': '/uploads/1753289025887_facebook.png',
      'instagram': '/uploads/1753289033324_instagram.png',
      'tiktok': '/uploads/1753289041115_tiktok.png',
      'youtube': '/uploads/1753289049933_youtube.png',
      'x': '/uploads/1753289090370_X.png',
      'hotmail': '/uploads/hotmail.svg',
      'linkedin': '/uploads/linkedin.svg',
      'openai': '/uploads/openai.svg',
      'wuthering': '/uploads/wuthering.svg',
      'other': '/uploads/other.svg'
    }
  },
  
  // Cài đặt đơn hàng
  ORDERS: {
    AUTO_COMPLETE_AFTER_HOURS: 24,
    REFUND_WINDOW_DAYS: 3,
    DISPUTE_RESOLUTION_DAYS: 7
  },
  
  // Cài đặt UI/UX
  UI: {
    ITEMS_PER_PAGE: 20,
    SEARCH_DEBOUNCE_MS: 300,
    TOAST_DURATION_MS: 3000,
    LOADING_TIMEOUT_MS: 30000
  },
  
  // Cài đặt API
  API: {
    RATE_LIMIT_REQUESTS: 100,
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 phút
    REQUEST_TIMEOUT_MS: 10000
  }
}

// Helper functions
export const getFeeAmount = (amount: number) => {
  const feePercent = APP_CONFIG.FEES.TRANSACTION_FEE_PERCENT / 100
  const calculatedFee = amount * feePercent
  
  return Math.min(
    Math.max(calculatedFee, APP_CONFIG.FEES.MIN_TRANSACTION_FEE),
    APP_CONFIG.FEES.MAX_TRANSACTION_FEE
  )
}

export const getNetAmount = (grossAmount: number) => {
  return grossAmount - getFeeAmount(grossAmount)
}

export const isValidPrice = (price: number) => {
  return price >= APP_CONFIG.LIMITS.MIN_PRODUCT_PRICE && 
         price <= APP_CONFIG.LIMITS.MAX_PRODUCT_PRICE
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}
// Cấu hình thông tin liên hệ - dễ dàng thay đổi
export const CONTACT_INFO = {
  // Thông tin công ty
  COMPANY_NAME: 'MMO Store',
  COMPANY_DESCRIPTION: 'Nền tảng mua bán tài khoản mạng xã hội uy tín',
  
  // Thông tin liên hệ
  EMAIL: {
    SUPPORT: 'dhhoang.dn2@gmail.com',
    SALES: 'dhhoang.dn2@gmail.com',
    INFO: 'dhhoang.dn2@gmail.com',
    ADMIN: 'dhhoang.dn2@gmail.com'
  },
  
  PHONE: {
    HOTLINE: '0862280068',
    SUPPORT: '0862280068',
    SALES: '0862280068'
  },
  
  // Địa chỉ
  ADDRESS: {
    STREET: '123 Đường ABC',
    DISTRICT: 'Quận 1',
    CITY: 'TP. Hồ Chí Minh',
    COUNTRY: 'Việt Nam',
    FULL: '123 Đường ABC, Quận 1, TP. Hồ Chí Minh, Việt Nam'
  },
  
  // Mạng xã hội
  SOCIAL: {
    FACEBOOK: 'https://facebook.com/mmostore.site',
    TWITTER: 'https://twitter.com/mmostore.site',
    INSTAGRAM: 'https://instagram.com/mmostore.site',
    YOUTUBE: 'https://youtube.com/mmostore.site',
    TIKTOK: 'https://tiktok.com/@mmostore.site'
  },
  
  // Giờ làm việc
  WORKING_HOURS: {
    WEEKDAYS: '8:00 - 18:00 (Thứ 2 - Thứ 6)',
    WEEKEND: '9:00 - 17:00 (Thứ 7 - Chủ nhật)',
    TIMEZONE: 'GMT+7'
  },
  
  // Thông tin pháp lý
  LEGAL: {
    TAX_CODE: '0123456789',
    BUSINESS_LICENSE: 'GP số 123/GP-UBND',
    ESTABLISHED_YEAR: '2024'
  },
  
  // Thông tin thanh toán
  PAYMENT: {
    BANK_NAME: 'Ngân hàng MBBANK',
    ACCOUNT_NUMBER: '0968470776',
    ACCOUNT_HOLDER: 'Đinh Huy Hoàng',
  }
}

// Helper functions để lấy thông tin
export const getContactEmail = (type: keyof typeof CONTACT_INFO.EMAIL = 'SUPPORT') => {
  return CONTACT_INFO.EMAIL[type]
}

export const getContactPhone = (type: keyof typeof CONTACT_INFO.PHONE = 'HOTLINE') => {
  return CONTACT_INFO.PHONE[type]
}

export const getFullAddress = () => {
  return CONTACT_INFO.ADDRESS.FULL
}

export const getSocialLink = (platform: keyof typeof CONTACT_INFO.SOCIAL) => {
  return CONTACT_INFO.SOCIAL[platform]
}

// Export contactInfo object for contact page compatibility
export const contactInfo = {
  name: CONTACT_INFO.COMPANY_NAME,
  description: CONTACT_INFO.COMPANY_DESCRIPTION,
  email: CONTACT_INFO.EMAIL.SUPPORT,
  phone: CONTACT_INFO.PHONE.HOTLINE,
  address: CONTACT_INFO.ADDRESS.FULL,
  workingHours: {
    weekdays: '8:00 - 18:00',
    saturday: '9:00 - 17:00',
    sunday: '9:00 - 17:00'
  },
  socialMedia: {
    facebook: CONTACT_INFO.SOCIAL.FACEBOOK,
    twitter: CONTACT_INFO.SOCIAL.TWITTER,
    instagram: CONTACT_INFO.SOCIAL.INSTAGRAM,
    linkedin: 'https://linkedin.com/company/mmostore.site'
  },
  legal: {
    companyName: CONTACT_INFO.COMPANY_NAME,
    taxCode: CONTACT_INFO.LEGAL.TAX_CODE,
    businessLicense: CONTACT_INFO.LEGAL.BUSINESS_LICENSE,
    registeredAddress: CONTACT_INFO.ADDRESS.FULL
  }
}
// Cấu hình thông điệp và văn bản - dễ dàng thay đổi
export const MESSAGES = {
  // Thông điệp chào mừng
  WELCOME: {
    TITLE: 'Chào mừng đến với MMO Store',
    SUBTITLE: 'Nền tảng mua bán tài khoản mạng xã hội uy tín và an toàn',
    DESCRIPTION: 'Khám phá hàng ngàn tài khoản chất lượng cao với giá cả hợp lý'
  },
  
  // Thông điệp lỗi
  ERRORS: {
    NETWORK: 'Lỗi kết nối mạng, vui lòng thử lại',
    UNAUTHORIZED: 'Bạn không có quyền truy cập',
    NOT_FOUND: 'Không tìm thấy trang yêu cầu',
    SERVER_ERROR: 'Lỗi server, vui lòng thử lại sau',
    VALIDATION: 'Dữ liệu không hợp lệ',
    INSUFFICIENT_CREDIT: 'Số dư không đủ để thực hiện giao dịch',
    PRODUCT_NOT_AVAILABLE: 'Sản phẩm không còn khả dụng',
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng'
  },
  
  // Thông điệp thành công
  SUCCESS: {
    LOGIN: 'Đăng nhập thành công',
    REGISTER: 'Đăng ký tài khoản thành công',
    LOGOUT: 'Đăng xuất thành công',
    PURCHASE: 'Mua hàng thành công',
    PRODUCT_CREATED: 'Tạo sản phẩm thành công',
    PRODUCT_UPDATED: 'Cập nhật sản phẩm thành công',
    PROFILE_UPDATED: 'Cập nhật thông tin thành công',
    PASSWORD_CHANGED: 'Đổi mật khẩu thành công',
    REPORT_SUBMITTED: 'Gửi báo cáo thành công'
  },
  
  // Thông điệp xác nhận
  CONFIRMATIONS: {
    DELETE_PRODUCT: 'Bạn có chắc chắn muốn xóa sản phẩm này?',
    DELETE_ACCOUNT: 'Bạn có chắc chắn muốn xóa tài khoản?',
    LOGOUT: 'Bạn có muốn đăng xuất?',
    PURCHASE: 'Xác nhận mua sản phẩm này?',
    CANCEL_ORDER: 'Bạn có chắc chắn muốn hủy đơn hàng?'
  },
  
  // Thông điệp trạng thái
  STATUS: {
    LOADING: 'Đang tải...',
    PROCESSING: 'Đang xử lý...',
    UPLOADING: 'Đang tải lên...',
    SAVING: 'Đang lưu...',
    SENDING: 'Đang gửi...',
    CONNECTING: 'Đang kết nối...'
  },
  
  // Thông điệp hướng dẫn
  INSTRUCTIONS: {
    UPLOAD_IMAGE: 'Chọn ảnh để tải lên (tối đa 5MB)',
    FILL_REQUIRED: 'Vui lòng điền đầy đủ thông tin bắt buộc',
    PASSWORD_REQUIREMENTS: 'Mật khẩu phải có ít nhất 6 ký tự',
    CONTACT_SUPPORT: 'Liên hệ hỗ trợ nếu bạn gặp vấn đề',
    CHECK_EMAIL: 'Kiểm tra email để xác nhận tài khoản'
  },
  
  // Thông điệp về sản phẩm
  PRODUCTS: {
    NO_PRODUCTS: 'Chưa có sản phẩm nào',
    OUT_OF_STOCK: 'Hết hàng',
    LIMITED_STOCK: 'Số lượng có hạn',
    NEW_ARRIVAL: 'Hàng mới về',
    FEATURED: 'Sản phẩm nổi bật',
    ON_SALE: 'Đang giảm giá'
  },
  
  // Thông điệp về đơn hàng
  ORDERS: {
    NO_ORDERS: 'Chưa có đơn hàng nào',
    ORDER_PENDING: 'Đơn hàng đang chờ xử lý',
    ORDER_COMPLETED: 'Đơn hàng đã hoàn thành',
    ORDER_CANCELLED: 'Đơn hàng đã bị hủy',
    ORDER_REFUNDED: 'Đơn hàng đã được hoàn tiền'
  },
  
  // Thông điệp về tài khoản
  ACCOUNT: {
    PROFILE_INCOMPLETE: 'Vui lòng hoàn thiện thông tin cá nhân',
    EMAIL_NOT_VERIFIED: 'Email chưa được xác minh',
    ACCOUNT_LOCKED: 'Tài khoản đã bị khóa',
    CREDIT_LOW: 'Số dư tài khoản thấp',
    BECOME_SELLER: 'Trở thành người bán để đăng sản phẩm'
  },
  
  // Thông điệp về bảo mật
  SECURITY: {
    SECURE_CONNECTION: 'Kết nối được bảo mật',
    DATA_ENCRYPTED: 'Dữ liệu được mã hóa',
    SAFE_PAYMENT: 'Thanh toán an toàn',
    PRIVACY_PROTECTED: 'Thông tin được bảo vệ'
  },
  
  // Thông điệp về hỗ trợ
  SUPPORT: {
    CONTACT_US: 'Liên hệ với chúng tôi',
    FAQ: 'Câu hỏi thường gặp',
    HELP_CENTER: 'Trung tâm hỗ trợ',
    LIVE_CHAT: 'Chat trực tuyến',
    EMAIL_SUPPORT: 'Hỗ trợ qua email',
    PHONE_SUPPORT: 'Hỗ trợ qua điện thoại'
  }
}

// Helper functions để lấy thông điệp
export const getMessage = (category: keyof typeof MESSAGES, key: string) => {
  const categoryMessages = MESSAGES[category] as Record<string, string>
  return categoryMessages[key] || 'Thông điệp không tìm thấy'
}

export const getErrorMessage = (key: keyof typeof MESSAGES.ERRORS) => {
  return MESSAGES.ERRORS[key]
}

export const getSuccessMessage = (key: keyof typeof MESSAGES.SUCCESS) => {
  return MESSAGES.SUCCESS[key]
}

export const getStatusMessage = (key: keyof typeof MESSAGES.STATUS) => {
  return MESSAGES.STATUS[key]
}
// Định nghĩa các loại credit trong hệ thống
export const CREDIT_TYPES = {
  AVAILABLE: 'available', // Credit có thể sử dụng ngay
  PENDING: 'pending',     // Credit đang bị giam giữ
  TOTAL: 'total'          // Tổng credit (available + pending)
} as const

// Type cho loại credit
export type CreditType = typeof CREDIT_TYPES[keyof typeof CREDIT_TYPES]

// Cấu hình thời gian giam giữ credit (3 ngày)
export const CREDIT_HOLD_CONFIG = {
  HOLD_DURATION_DAYS: 3,
  HOLD_DURATION_MS: 3 * 24 * 60 * 60 * 1000, // 3 ngày tính bằng milliseconds
  MIN_WITHDRAWAL_AMOUNT: 50000,  // Số tiền rút tối thiểu
  MAX_WITHDRAWAL_AMOUNT: 10000000, // Số tiền rút tối đa
  MIN_DEPOSIT_AMOUNT: 10000,     // Số tiền nạp tối thiểu
  MAX_DEPOSIT_AMOUNT: 50000000   // Số tiền nạp tối đa
} as const

// Trạng thái của credit bị giam giữ
export const PENDING_CREDIT_STATUS = {
  PENDING: 'pending',     // Đang chờ
  RELEASED: 'released',   // Đã được giải phóng
  CANCELLED: 'cancelled'  // Đã bị hủy (trường hợp hoàn tiền)
} as const

export type PendingCreditStatus = typeof PENDING_CREDIT_STATUS[keyof typeof PENDING_CREDIT_STATUS]

// Lý do giam giữ credit
export const CREDIT_HOLD_REASONS = {
  SALE_COMMISSION: 'sale_commission',     // Hoa hồng từ bán hàng
  REFUND_PROTECTION: 'refund_protection', // Bảo vệ hoàn tiền
  DISPUTE_RESOLUTION: 'dispute_resolution' // Giải quyết tranh chấp
} as const

export type CreditHoldReason = typeof CREDIT_HOLD_REASONS[keyof typeof CREDIT_HOLD_REASONS]

// Hàm lấy tên hiển thị cho lý do giam giữ
export const getCreditHoldReasonDisplayName = (reason: string): string => {
  switch (reason) {
    case CREDIT_HOLD_REASONS.SALE_COMMISSION: return 'Hoa hồng bán hàng'
    case CREDIT_HOLD_REASONS.REFUND_PROTECTION: return 'Bảo vệ hoàn tiền'
    case CREDIT_HOLD_REASONS.DISPUTE_RESOLUTION: return 'Giải quyết tranh chấp'
    default: return 'Không xác định'
  }
}

// Hàm lấy màu sắc cho trạng thái credit
export const getPendingCreditStatusColor = (status: string): string => {
  switch (status) {
    case PENDING_CREDIT_STATUS.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case PENDING_CREDIT_STATUS.RELEASED: return 'bg-green-100 text-green-800 border-green-200'
    case PENDING_CREDIT_STATUS.CANCELLED: return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Hàm lấy tên hiển thị cho trạng thái credit
export const getPendingCreditStatusDisplayName = (status: string): string => {
  switch (status) {
    case PENDING_CREDIT_STATUS.PENDING: return 'Đang chờ'
    case PENDING_CREDIT_STATUS.RELEASED: return 'Đã giải phóng'
    case PENDING_CREDIT_STATUS.CANCELLED: return 'Đã hủy'
    default: return 'Không xác định'
  }
}

// Hàm tính toán thời gian còn lại để giải phóng credit
export const calculateRemainingHoldTime = (createdAt: Date): number => {
  const now = new Date().getTime()
  const releaseTime = new Date(createdAt).getTime() + CREDIT_HOLD_CONFIG.HOLD_DURATION_MS
  return Math.max(0, releaseTime - now)
}

// Hàm kiểm tra credit có thể được giải phóng không
export const canReleasePendingCredit = (createdAt: Date): boolean => {
  return calculateRemainingHoldTime(createdAt) === 0
}

// Hàm format thời gian còn lại
export const formatRemainingTime = (remainingMs: number): string => {
  if (remainingMs === 0) return 'Có thể giải phóng'
  
  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000))
  const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
  
  if (days > 0) {
    return `${days} ngày ${hours} giờ`
  } else if (hours > 0) {
    return `${hours} giờ ${minutes} phút`
  } else {
    return `${minutes} phút`
  }
}
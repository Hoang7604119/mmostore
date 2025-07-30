// Export tất cả config để dễ dàng import
export * from './contact'
export * from './app'
export * from './messages'

// Re-export các config chính để dễ sử dụng
export { CONTACT_INFO, getContactEmail, getContactPhone, getFullAddress, getSocialLink } from './contact'
export { APP_CONFIG, getFeeAmount, getNetAmount, isValidPrice, formatCurrency } from './app'
export { MESSAGES, getMessage, getErrorMessage, getSuccessMessage, getStatusMessage } from './messages'
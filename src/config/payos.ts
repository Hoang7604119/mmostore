// PayOS Configuration
export const PAYOS_CONFIG = {
  CLIENT_ID: process.env.PAYOS_CLIENT_ID || 'e903742c-1c37-416b-9c10-bb7d8af8d765',
  API_KEY: process.env.PAYOS_API_KEY || '98adda5d-2b6a-4acb-8da3-4e30fbee8052',
  CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY || 'a51e671a08b1b5356eb2294b823851cf0d21659bbe11bf43c0d3479f55ed21a3',
  
  // URLs
  RETURN_URL: process.env.NODE_ENV === 'production' 
    ? 'https://mmostore.site/api/payment/return'
    : 'http://localhost:3000/api/payment/return',
  cancelUrl: process.env.NODE_ENV === 'production'
    ? 'https://mmostore.site/api/payment/cancel'
    : 'http://localhost:3000/api/payment/cancel',
  webhookUrl: process.env.NODE_ENV === 'production'
    ? 'https://mmostore.site/api/payment/webhook'
    : 'http://localhost:3000/api/payment/webhook'
}

// Export PayOS instance
import PayOS from '@payos/node'

export const payOS = new PayOS(
  PAYOS_CONFIG.CLIENT_ID,
  PAYOS_CONFIG.API_KEY,
  PAYOS_CONFIG.CHECKSUM_KEY
)
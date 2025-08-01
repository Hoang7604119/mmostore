// Script để setup cron job cho việc giải phóng credit
// Chạy script này để tạo cron job tự động giải phóng credit mỗi giờ

require('dotenv').config({ path: '.env.local' })
const cron = require('node-cron')
const fetch = require('node-fetch')

// Cấu hình
const CRON_SECRET = process.env.CRON_SECRET || 'default-cron-secret'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const RELEASE_CREDITS_URL = `${API_URL}/api/cron/release-credits`

// Hàm gọi API giải phóng credit
async function releasePendingCredits() {
  try {
    console.log(`[${new Date().toISOString()}] Bắt đầu giải phóng pending credits...`)
    
    const response = await fetch(RELEASE_CREDITS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log(`[${new Date().toISOString()}] Thành công:`, result)
    } else {
      console.error(`[${new Date().toISOString()}] Lỗi:`, result)
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Lỗi khi gọi API:`, error)
  }
}

// Setup cron job chạy mỗi giờ
cron.schedule('0 * * * *', () => {
  releasePendingCredits()
}, {
  scheduled: true,
  timezone: 'Asia/Ho_Chi_Minh'
})

// Chạy ngay lần đầu khi start
releasePendingCredits()

console.log('Cron job đã được setup để giải phóng pending credits mỗi giờ')
console.log('Timezone: Asia/Ho_Chi_Minh')
console.log('Schedule: 0 * * * * (mỗi giờ vào phút 0)')

// Giữ process chạy
process.on('SIGINT', () => {
  console.log('\nDừng cron job...')
  process.exit(0)
})

// Export để có thể import trong các file khác
module.exports = {
  releasePendingCredits
}
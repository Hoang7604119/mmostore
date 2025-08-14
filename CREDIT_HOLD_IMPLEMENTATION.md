# Triển Khai Tính Năng Giam Giữ Credit

## Tổng Quan
Tính năng này cho phép giam giữ credit của seller trong 3 ngày sau khi bán hàng thành công, thay vì cộng credit ngay lập tức.

## Các Thành Phần Đã Triển Khai

### 1. Constants và Utilities
- `src/constants/roles.ts` - Định nghĩa các role người dùng
- `src/constants/credit.ts` - Định nghĩa các hằng số liên quan đến credit

### 2. Models
- `src/models/PendingCredit.ts` - Model quản lý credit bị giam giữ
- `src/models/User.ts` - Đã cập nhật thêm trường `pendingCredit`

### 3. APIs
- `src/app/api/buyer/orders/route.ts` - Đã cập nhật logic bán hàng
- `src/app/api/user/pending-credits/route.ts` - API cho user xem pending credits
- `src/app/api/admin/pending-credits/route.ts` - API cho admin quản lý pending credits
- `src/app/api/cron/release-credits/route.ts` - API để giải phóng credit tự động

### 4. Components và Pages
- `src/components/PendingCreditsSection.tsx` - Component hiển thị pending credits
- `src/app/dashboard/credit/page.tsx` - Đã cập nhật hiển thị credit
- `src/app/dashboard/admin/pending-credits/page.tsx` - Trang admin quản lý pending credits

### 5. Cron Job
- `scripts/setup-cron.js` - Script setup cron job tự động

## Các Bước Triển Khai

### Bước 1: Cài Đặt Dependencies
```bash
npm install node-cron
```

### Bước 2: Cập Nhật Environment Variables
Thêm vào file `.env.local`:
```env
CRON_SECRET=your-secure-cron-secret-here
```

### Bước 3: Chạy Migration Database
Do đã thêm trường `pendingCredit` vào User model, cần cập nhật database:
```javascript
// Chạy script này trong MongoDB shell hoặc tạo migration
db.users.updateMany(
  { pendingCredit: { $exists: false } },
  { $set: { pendingCredit: 0 } }
)
```

### Bước 4: Setup Cron Job
Có 2 cách setup cron job:

#### Cách 1: Sử dụng Node.js Script
```bash
node scripts/setup-cron.js
```

#### Cách 2: Sử dụng System Cron (Linux/Mac)
Thêm vào crontab:
```bash
# Chạy mỗi ngày vào 17:00 UTC (do giới hạn của Vercel)
0 17 * * * curl -X POST -H "Authorization: Bearer your-cron-secret" http://localhost:3000/api/cron/release-credits
```

#### Cách 3: Sử dụng Vercel Cron (Production)
Tạo file `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/release-credits",
      "schedule": "0 17 * * *"
    }
  ]
}
```

**Lưu ý:** Do giới hạn của Vercel, cron job chỉ có thể chạy một lần mỗi ngày vào 17:00 UTC (00:00 GMT+7).

### Bước 5: Kiểm Tra Hoạt Động

1. **Test bán hàng:**
   - Tạo đơn hàng mới
   - Kiểm tra credit của seller không tăng ngay
   - Kiểm tra `pendingCredit` của seller tăng
   - Kiểm tra PendingCredit record được tạo

2. **Test hiển thị:**
   - Vào trang `/dashboard/credit` kiểm tra hiển thị pending credits
   - Vào trang `/dashboard/admin/pending-credits` (với tài khoản admin)

3. **Test cron job:**
   - Gọi API `/api/cron/release-credits` thủ công
   - Kiểm tra credit được giải phóng đúng

## Cấu Hình

### Thời Gian Giam Giữ
Thay đổi trong `src/constants/credit.ts`:
```typescript
export const CREDIT_HOLD_CONFIG = {
  HOLD_DURATION_DAYS: 3, // Thay đổi số ngày ở đây
  HOLD_DURATION_MS: 3 * 24 * 60 * 60 * 1000
}
```

### Lý Do Giam Giữ
Thêm lý do mới trong `src/constants/credit.ts`:
```typescript
export const CREDIT_HOLD_REASONS = {
  SALE_COMMISSION: 'sale_commission',
  REFUND_PROTECTION: 'refund_protection',
  DISPUTE_RESOLUTION: 'dispute_resolution',
  // Thêm lý do mới ở đây
}
```

## Monitoring và Maintenance

### 1. Kiểm Tra Trạng Thái
- API GET `/api/cron/release-credits` để xem thống kê
- Trang admin `/dashboard/admin/pending-credits` để quản lý

### 2. Logs
- Cron job sẽ log kết quả vào console
- Kiểm tra logs để đảm bảo hoạt động đúng

### 3. Backup
- Backup database trước khi triển khai
- Backup định kỳ PendingCredit collection

## Troubleshooting

### Lỗi Thường Gặp

1. **Cron job không chạy:**
   - Kiểm tra CRON_SECRET
   - Kiểm tra network connectivity
   - Kiểm tra logs

2. **Credit không được giải phóng:**
   - Kiểm tra releaseDate
   - Kiểm tra status của PendingCredit
   - Chạy thủ công API cron

3. **Hiển thị không đúng:**
   - Clear cache browser
   - Kiểm tra API response
   - Kiểm tra component state

### Debug Commands

```bash
# Kiểm tra pending credits trong database
mongo
use your_database
db.pendingcredits.find().pretty()

# Kiểm tra user pending credit
db.users.find({pendingCredit: {$gt: 0}}, {username: 1, credit: 1, pendingCredit: 1})

# Test cron API
curl -X POST -H "Authorization: Bearer your-cron-secret" http://localhost:3000/api/cron/release-credits
```

## Security Notes

1. **CRON_SECRET:** Sử dụng secret mạnh và không chia sẻ
2. **Admin Access:** Chỉ admin mới có thể truy cập trang quản lý
3. **API Protection:** Tất cả API đều có authentication
4. **Transaction Safety:** Sử dụng MongoDB transactions để đảm bảo consistency

## Performance Considerations

1. **Index Database:**
```javascript
// Tạo index cho performance
db.pendingcredits.createIndex({"userId": 1})
db.pendingcredits.createIndex({"status": 1, "releaseDate": 1})
db.pendingcredits.createIndex({"createdAt": -1})
```

2. **Pagination:** API đã implement pagination để tránh load quá nhiều data

3. **Cron Frequency:** Do giới hạn của Vercel, chỉ có thể chạy một lần mỗi ngày vào 17:00 UTC (00:00 GMT+7)

## Future Enhancements

1. **Email Notifications:** Thông báo khi credit được giải phóng
2. **Webhook Support:** Gọi webhook khi có sự kiện credit
3. **Advanced Analytics:** Thống kê chi tiết về pending credits
4. **Bulk Operations:** Xử lý hàng loạt pending credits
5. **Custom Hold Duration:** Cho phép set thời gian giam giữ khác nhau cho từng loại giao dịch
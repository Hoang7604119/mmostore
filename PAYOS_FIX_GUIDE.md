# Hướng dẫn Fix Vấn đề PayOS Webhook

## 🚨 Vấn đề hiện tại
- Thanh toán thành công trên PayOS nhưng credit chưa được cập nhật trong hệ thống
- Webhook từ PayOS không được gọi hoặc bị lỗi

## 🔧 Các file đã được cập nhật

### 1. Enhanced Webhook Logging
- **File:** `src/app/api/payment/webhook/route.ts`
- **Thay đổi:** Thêm logging chi tiết với timestamp để debug

### 2. Payment Sync API (Giải pháp tạm thời)
- **File:** `src/app/api/payment/sync/route.ts` (MỚI)
- **Chức năng:** Đồng bộ trạng thái thanh toán từ PayOS API

### 3. Admin Payment Management
- **File:** `src/app/dashboard/admin/payments/page.tsx` (MỚI)
- **Chức năng:** Giao diện quản lý và sync payments cho admin

## 🚀 Các bước Deploy

### Bước 1: Deploy code mới
```bash
# Trên server production
cd /path/to/your/app
git pull origin main
npm install
npm run build
pm2 restart all
# hoặc
systemctl restart your-app-service
```

### Bước 2: Kiểm tra webhook trong PayOS Dashboard
1. Truy cập: https://my.payos.vn/
2. Đăng nhập với tài khoản PayOS
3. Vào **Cài đặt** > **Webhook**
4. Kiểm tra:
   - Webhook URL: `https://mmostore.site/api/payment/webhook`
   - Trạng thái: **Kích hoạt**
   - Xem **Lịch sử gọi webhook**

### Bước 3: Test webhook endpoint
```bash
# Test GET
curl https://mmostore.site/api/payment/webhook

# Test POST (giả lập webhook)
curl -X POST https://mmostore.site/api/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "code": "00",
    "desc": "success",
    "data": {
      "orderCode": 1753903120107,
      "amount": 10000,
      "description": "test",
      "code": "00",
      "desc": "success"
    }
  }'
```

### Bước 4: Sử dụng Admin Panel để sync
1. Truy cập: `https://mmostore.site/dashboard/admin/payments`
2. Đăng nhập với tài khoản admin
3. Xem danh sách payments pending
4. Click "Sync" cho từng payment cần xử lý

## 🔍 Debug Steps

### 1. Kiểm tra logs server
```bash
# PM2
pm2 logs --lines 100

# Docker
docker logs container_name

# Systemd
journalctl -u your-service -f
```

### 2. Kiểm tra database
```javascript
// Trong MongoDB shell hoặc Compass
db.payments.find({ status: "pending" }).sort({ createdAt: -1 })
```

### 3. Test manual sync
```bash
# Với admin token
curl -X POST https://mmostore.site/api/payment/sync \
  -H "Content-Type: application/json" \
  -H "Cookie: token=your_admin_token" \
  -d '{"orderCode": 1753903120107}'
```

## 🛠️ Giải pháp tạm thời

### Option 1: Manual Sync qua Admin Panel
- Truy cập admin panel
- Sync từng payment pending

### Option 2: Batch Sync Script
```javascript
// Tạo script sync hàng loạt
const syncAllPending = async () => {
  const response = await fetch('/api/payment/sync')
  const data = await response.json()
  
  for (const payment of data.data.payments) {
    await fetch('/api/payment/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderCode: payment.orderCode })
    })
  }
}
```

### Option 3: Cronjob Auto Sync
```bash
# Thêm vào crontab
*/5 * * * * curl -X GET https://mmostore.site/api/payment/auto-sync
```

## 📞 Liên hệ PayOS Support

Nếu webhook vẫn không hoạt động:
- **Email:** support@payos.vn
- **Hotline:** 1900 6173
- **Thông tin cần cung cấp:**
  - Client ID: e903742c-1c37-416b-9c10-bb7d8af8d765
  - Webhook URL: https://mmostore.site/api/payment/webhook
  - Order Code có vấn đề: 1753903120107
  - Thời gian giao dịch
  - Mô tả vấn đề: Webhook không được gọi

## ✅ Checklist

- [ ] Deploy code mới lên production
- [ ] Kiểm tra webhook URL trong PayOS Dashboard
- [ ] Test webhook endpoint
- [ ] Kiểm tra logs server
- [ ] Sử dụng admin panel để sync payments pending
- [ ] Liên hệ PayOS support nếu cần

## 🔮 Giải pháp dài hạn

1. **Implement retry mechanism** cho webhook
2. **Add webhook signature validation** tốt hơn
3. **Create monitoring system** cho webhook health
4. **Implement fallback polling** từ PayOS API
5. **Add alerting** khi webhook fail

---

**Lưu ý:** Đây là giải pháp tạm thời để xử lý payments đang pending. Cần fix webhook để tự động hóa hoàn toàn.
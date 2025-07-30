# Debug PayOS Webhook Issue

## Vấn đề hiện tại
- Thanh toán thành công trên PayOS nhưng credit chưa được cập nhật
- Webhook có thể không được gọi từ PayOS

## Các bước kiểm tra

### 1. Kiểm tra Webhook URL trong PayOS Dashboard

**Truy cập:** https://my.payos.vn/

**Các bước:**
1. Đăng nhập vào PayOS Dashboard
2. Vào **Cài đặt** > **Webhook**
3. Kiểm tra Webhook URL có đúng là: `https://mmostore.site/api/payment/webhook`
4. Kiểm tra trạng thái webhook có được **Kích hoạt** không
5. Xem **Lịch sử gọi webhook** để kiểm tra có request nào được gửi không

### 2. Test Webhook URL

```bash
# Test GET request
curl -X GET https://mmostore.site/api/payment/webhook

# Test POST request (giả lập webhook)
curl -X POST https://mmostore.site/api/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "code": "00",
    "desc": "success",
    "data": {
      "orderCode": 1753903120107,
      "amount": 10000,
      "description": "03120107",
      "code": "00",
      "desc": "success"
    }
  }'
```

### 3. Kiểm tra Logs Server

**Nếu sử dụng PM2:**
```bash
pm2 logs
pm2 logs --lines 100
```

**Nếu sử dụng Docker:**
```bash
docker logs container_name
```

**Nếu sử dụng systemd:**
```bash
journalctl -u your_service_name -f
```

### 4. Kiểm tra Network/Firewall

1. Đảm bảo port 443 (HTTPS) được mở
2. Kiểm tra SSL certificate hợp lệ
3. Kiểm tra domain có resolve đúng IP không

### 5. Cấu hình PayOS hiện tại

```javascript
// Từ file config/payos.ts
webhookUrl: 'https://mmostore.site/api/payment/webhook'
```

### 6. Test với orderCode thực tế

```bash
# Test với orderCode đang pending
curl -X POST https://mmostore.site/api/payment/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"orderCode": 1753903120107}'
```

## Các nguyên nhân có thể

1. **Webhook URL chưa được cấu hình trong PayOS Dashboard**
2. **Webhook bị vô hiệu hóa trong PayOS**
3. **SSL certificate có vấn đề**
4. **Firewall chặn request từ PayOS**
5. **PayOS không thể reach được server**
6. **Webhook signature verification thất bại**

## Giải pháp tạm thời

Nếu webhook không hoạt động, có thể:
1. Sử dụng polling để kiểm tra trạng thái thanh toán
2. Tạo cronjob để sync trạng thái từ PayOS API
3. Xử lý manual thông qua admin panel

## Liên hệ hỗ trợ PayOS

Nếu vấn đề vẫn tồn tại, liên hệ:
- Email: support@payos.vn
- Hotline: 1900 6173
- Cung cấp thông tin: Client ID, Order Code, thời gian giao dịch
# Cấu Hình Email - Resend Integration

## Tổng quan

Dự án đã được cập nhật để tuân thủ các khuyến nghị tốt nhất của Resend về gửi email:

### ✅ Đã thực hiện

1. **Plain Text Version**: Tất cả email hiện đã bao gồm cả phiên bản HTML và plain text
2. **Subdomain Usage**: Chuyển từ `noreply@mmostore.site` sang `auth@mail.mmostore.site`
3. **Centralized Configuration**: Tạo file cấu hình tập trung tại `src/config/email.ts`

## Cấu trúc Email Addresses

```
auth@mail.mmostore.site         - Email xác thực đăng ký
notifications@mail.mmostore.site - Thông báo hệ thống
support@mail.mmostore.site      - Hỗ trợ khách hàng
orders@mail.mmostore.site       - Thông báo đơn hàng
```

## Cấu hình DNS cần thiết

### 1. SPF Record
```
TXT mail.mmostore.site "v=spf1 include:_spf.resend.com ~all"
```

### 2. DKIM Records
Thêm các DKIM records do Resend cung cấp cho subdomain `mail.mmostore.site`

### 3. DMARC Record
```
TXT _dmarc.mail.mmostore.site "v=DMARC1; p=quarantine; rua=mailto:dmarc@mmostore.site"
```

## Files đã thay đổi

### 1. `src/config/email.ts` (Mới)
- Cấu hình tập trung cho tất cả email settings
- Templates với cả HTML và plain text
- Validation helpers

### 2. `src/lib/emailVerification.ts`
- Sử dụng cấu hình từ `email.ts`
- Thêm plain text version
- Chuyển sang subdomain `auth@mail.mmostore.site`

## Lợi ích

### 🚀 Deliverability
- Sử dụng subdomain giúp bảo vệ reputation của domain chính
- Plain text version đảm bảo tương thích với mọi email client

### 🔧 Maintainability
- Cấu hình tập trung dễ quản lý
- Template system có thể mở rộng
- Type-safe configuration

### 📊 Analytics
- Có thể theo dõi performance theo từng loại email
- Dễ dàng A/B testing

## Sử dụng

### Gửi email xác thực
```typescript
import { sendVerificationEmail } from '@/lib/emailVerification'

const success = await sendVerificationEmail('user@example.com', '123456')
```

### Thêm template mới
```typescript
// Trong src/config/email.ts
TEMPLATES: {
  NEW_TEMPLATE: {
    subject: 'Subject here',
    getHtml: (data) => `HTML template`,
    getText: (data) => `Plain text template`
  }
}
```

## Monitoring

### Resend Dashboard
- Theo dõi delivery rates
- Xem bounce/complaint rates
- Analytics chi tiết

### Logs
- Tất cả email sending được log trong console
- Error handling với detailed messages

## Next Steps

1. **Cấu hình DNS**: Thêm các DNS records cần thiết
2. **Domain Verification**: Verify subdomain trong Resend dashboard
3. **Testing**: Test gửi email với subdomain mới
4. **Monitoring**: Theo dõi delivery rates sau khi deploy

## Troubleshooting

### Email không được gửi
1. Kiểm tra DNS records
2. Verify domain trong Resend
3. Kiểm tra API key
4. Xem logs trong Resend dashboard

### Delivery issues
1. Kiểm tra SPF/DKIM/DMARC
2. Monitor reputation scores
3. Kiểm tra content spam score
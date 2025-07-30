# Cấu hình ứng dụng (Easy Config)

Thư mục này chứa các file cấu hình để dễ dàng thay đổi thông tin ứng dụng mà không cần sửa code.

## Các file cấu hình

### 1. `contact.ts` - Thông tin liên hệ
Chứa tất cả thông tin liên hệ của công ty:
- Email (support, sales, info, admin)
- Số điện thoại (hotline, support, sales)
- Địa chỉ công ty
- Mạng xã hội
- Giờ làm việc
- Thông tin pháp lý
- Thông tin thanh toán

**Cách sử dụng:**
```typescript
import { CONTACT_INFO, getContactEmail, getContactPhone } from '@/config/contact'

// Lấy email hỗ trợ
const supportEmail = getContactEmail('SUPPORT')

// Lấy số hotline
const hotline = getContactPhone('HOTLINE')

// Lấy địa chỉ đầy đủ
const address = CONTACT_INFO.ADDRESS.FULL
```

### 2. `app.ts` - Cài đặt ứng dụng
Chứa các cài đặt hệ thống:
- Thông tin ứng dụng (tên, phiên bản, mô tả)
- Cài đặt phí và hoa hồng
- Giới hạn hệ thống
- Cài đặt bảo mật
- Cài đặt email, thông báo
- Cài đặt sản phẩm, đơn hàng
- Cài đặt UI/UX và API

**Cách sử dụng:**
```typescript
import { APP_CONFIG, getFeeAmount, formatCurrency } from '@/config/app'

// Tính phí giao dịch
const fee = getFeeAmount(100000) // Phí cho giao dịch 100,000 VND

// Format tiền tệ
const formattedPrice = formatCurrency(100000) // "100.000 ₫"

// Lấy giới hạn
const maxUploadSize = APP_CONFIG.LIMITS.MAX_UPLOAD_SIZE
```

### 3. `messages.ts` - Thông điệp và văn bản
Chứa tất cả thông điệp hiển thị trong ứng dụng:
- Thông điệp chào mừng
- Thông điệp lỗi
- Thông điệp thành công
- Thông điệp xác nhận
- Thông điệp trạng thái
- Hướng dẫn sử dụng

**Cách sử dụng:**
```typescript
import { MESSAGES, getErrorMessage, getSuccessMessage } from '@/config/messages'

// Lấy thông điệp lỗi
const errorMsg = getErrorMessage('NETWORK')

// Lấy thông điệp thành công
const successMsg = getSuccessMessage('LOGIN')

// Lấy thông điệp chào mừng
const welcomeTitle = MESSAGES.WELCOME.TITLE
```

## Hướng dẫn thay đổi cấu hình

### Thay đổi thông tin liên hệ
1. Mở file `contact.ts`
2. Sửa các giá trị trong object `CONTACT_INFO`
3. Lưu file

### Thay đổi cài đặt phí giao dịch
1. Mở file `app.ts`
2. Sửa các giá trị trong `APP_CONFIG.FEES`
3. Lưu file

### Thay đổi thông điệp hiển thị
1. Mở file `messages.ts`
2. Sửa các giá trị trong object `MESSAGES`
3. Lưu file

## Lưu ý quan trọng

1. **Backup trước khi thay đổi**: Luôn sao lưu file gốc trước khi chỉnh sửa
2. **Kiểm tra syntax**: Đảm bảo syntax TypeScript đúng sau khi chỉnh sửa
3. **Test sau khi thay đổi**: Kiểm tra ứng dụng hoạt động bình thường
4. **Restart server**: Khởi động lại server sau khi thay đổi cấu hình

## Ví dụ thay đổi thông tin công ty

```typescript
// Trong contact.ts
export const CONTACT_INFO = {
  COMPANY_NAME: 'Tên Công Ty Mới',
  EMAIL: {
    SUPPORT: 'support@congtymoicuaban.com',
    // ...
  },
  PHONE: {
    HOTLINE: '1900-1234',
    // ...
  },
  // ...
}
```

## Ví dụ thay đổi phí giao dịch

```typescript
// Trong app.ts
export const APP_CONFIG = {
  FEES: {
    TRANSACTION_FEE_PERCENT: 3, // Giảm từ 5% xuống 3%
    MIN_TRANSACTION_FEE: 500,   // Giảm phí tối thiểu
    // ...
  },
  // ...
}
```

Với cách tổ chức này, bạn có thể dễ dàng thay đổi mọi thông tin hiển thị và cài đặt của ứng dụng mà không cần tìm kiếm trong nhiều file code khác nhau.
# Tích hợp Casso với PayOS

## Webhook URL cho Casso

**URL Webhook:** `https://mmostore.site/api/payment/casso-webhook`

Vui lòng thêm URL này vào cấu hình webhook trong tài khoản Casso của bạn.

## Các thay đổi đã thực hiện

### 1. Tạo Casso Webhook Handler
- **File:** `src/app/api/payment/casso-webhook/route.ts`
- **Chức năng:** 
  - Xác thực chữ ký từ Casso
  - Xử lý dữ liệu giao dịch
  - Tìm kiếm user theo username trong mô tả giao dịch
  - Tự động cập nhật credit cho user
  - Lưu trữ giao dịch vào database

### 2. Tạo Model CassoTransaction
- **File:** `src/models/CassoTransaction.ts`
- **Chức năng:** Lưu trữ thông tin giao dịch từ Casso

### 3. Tạo API Đồng bộ Casso
- **File:** `src/app/api/payment/sync-casso/route.ts`
- **Chức năng:** Cho phép đồng bộ thủ công các giao dịch từ Casso

### 4. Cập nhật Giao diện Credit
- **File:** `src/app/dashboard/credit/page.tsx`
- **Thay đổi:**
  - Kích hoạt lại nút QR Pay
  - Thêm chức năng tự động đồng bộ khi bấm "Kiểm tra trạng thái"
  - Cập nhật logic xử lý thanh toán

### 5. Cấu hình Biến môi trường
- **File:** `.env.local`
- **Thêm:**
  - `CASSO_API_KEY`: API key từ Casso
  - `CASSO_SECURITY_KEY`: Security key để xác thực webhook

## Cách hoạt động

### Quy trình thanh toán tự động:
1. User chuyển khoản với nội dung chứa username
2. Casso gửi webhook đến `https://mmostore.site/api/payment/casso-webhook`
3. System tự động:
   - Xác thực webhook
   - Tìm user theo username
   - Cập nhật credit
   - Tạo payment record
   - Lưu giao dịch Casso

### Quy trình đồng bộ thủ công:
1. User bấm nút "Kiểm tra trạng thái" trong modal thanh toán
2. System gọi API đồng bộ Casso
3. Lấy các giao dịch mới từ Casso API
4. Xử lý và cập nhật credit nếu có giao dịch phù hợp

## Lưu ý quan trọng

1. **Format nội dung chuyển khoản:** User cần ghi username trong nội dung chuyển khoản
2. **Bảo mật:** Webhook được xác thực bằng security key
3. **Tránh trùng lặp:** Mỗi giao dịch Casso chỉ được xử lý một lần
4. **Log giao dịch:** Tất cả giao dịch đều được lưu vào database để audit

## Biến môi trường cần thêm vào Vercel

```
CASSO_API_KEY=AK_CS.450eb7106e1b11f0b7f9c39f1519547d.Sem7C7W21RvQaa6u9JC6T9pJdKxhkNJYBziA8A5sGcqvCgoDRa3lPKEO9Rn7Y910m0zRuHG0
CASSO_SECURITY_KEY=xV7m0hpeDleyV0vqXSyYeInZDdGaIHCdBahonmTxf7thmx4UU6IBwGR71jdzSRVk
```

## Test webhook

Sau khi thêm webhook URL vào Casso, bạn có thể test bằng cách:
1. Thực hiện một giao dịch chuyển khoản test với username hợp lệ
2. Kiểm tra logs trong Vercel để xem webhook có được gọi không
3. Kiểm tra database để xem giao dịch có được lưu không

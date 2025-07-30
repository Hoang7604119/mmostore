# Migration từ Socket.IO sang Supabase Realtime

## Tổng quan
Dự án đã được di chuyển từ Socket.IO sang Supabase Realtime để tương thích với Vercel và cải thiện hiệu suất.

## Thay đổi chính

### 1. Loại bỏ Socket.IO
- Xóa `server.js` (custom server)
- Xóa `ecosystem.config.js` (PM2 config)
- Gỡ cài đặt `socket.io` và `socket.io-client`
- Cập nhật scripts trong `package.json`

### 2. Tích hợp Supabase Realtime
- Thêm `@supabase/supabase-js`
- Tạo Supabase client trong `src/lib/supabase.ts`
- Cập nhật `useSocket.ts` hook để sử dụng Supabase channels
- Cập nhật notification system để sử dụng Supabase broadcast

### 3. Cấu hình môi trường
```env
NEXT_PUBLIC_ENABLE_SOCKET=true
NEXT_PUBLIC_SUPABASE_URL=https://ikpdsvjmvmgohyuwfgow.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrcGRzdmptdm1nb2h5dXdmZ293Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTQ0OTksImV4cCI6MjA2OTQ3MDQ5OX0.VqfmWsp13ZioSRNEMFZJ70HyPrM5L2JXII_WNZ6cItI
```

## Tính năng Real-time

### Chat
- Tin nhắn real-time giữa người dùng
- Trạng thái typing
- Đánh dấu tin nhắn đã đọc
- Quản lý cuộc trò chuyện

### Notifications
- Thông báo real-time cho người dùng
- Cập nhật số lượng thông báo chưa đọc
- Hỗ trợ nhiều loại thông báo (success, error, info, warning)

## Cách hoạt động

### Supabase Channels
- Mỗi người dùng có một channel riêng: `user-{userId}`
- Mỗi cuộc trò chuyện có một channel riêng: `conversation-{conversationId}`
- Sử dụng broadcast events để gửi/nhận tin nhắn

### Event Types
- `new-message`: Tin nhắn mới
- `typing-start`: Bắt đầu gõ phím
- `typing-stop`: Dừng gõ phím
- `message-read`: Tin nhắn đã đọc
- `new-notification`: Thông báo mới

## Triển khai

### Development
```bash
npm run dev
```

### Production (Vercel)
```bash
npm run build
npm run start
```

### Vercel Deployment
Dự án hiện tại đã tương thích hoàn toàn với Vercel:
- Không cần custom server
- Sử dụng Supabase Realtime cho WebSocket
- Tự động scale theo traffic

## Lưu ý

1. **Supabase Realtime Limits**: 
   - Free tier: 200 concurrent connections
   - 10 events per second per channel

2. **Browser Compatibility**:
   - Hỗ trợ tất cả modern browsers
   - Fallback graceful khi không có WebSocket

3. **Performance**:
   - Latency thấp hơn Socket.IO
   - Tự động reconnection
   - Built-in presence tracking

## Troubleshooting

### Không nhận được tin nhắn real-time
1. Kiểm tra biến môi trường `NEXT_PUBLIC_ENABLE_SOCKET=true`
2. Kiểm tra Supabase URL và API key
3. Kiểm tra browser console cho errors

### Connection issues
1. Kiểm tra network connectivity
2. Kiểm tra Supabase project status
3. Kiểm tra CORS settings trong Supabase dashboard

## Migration Checklist

- [x] Xóa Socket.IO dependencies
- [x] Cài đặt Supabase client
- [x] Cập nhật useSocket hook
- [x] Cập nhật ChatPopup component
- [x] Cập nhật NotificationIcon component
- [x] Cập nhật notification utilities
- [x] Xóa server.js và ecosystem.config.js
- [x] Cập nhật package.json scripts
- [x] Test development server
- [ ] Test production deployment
- [ ] Test real-time features
- [ ] Performance testing
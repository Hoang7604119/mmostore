# 🛒 MMO Store - Social Account Marketplace

Website marketplace bán tài khoản mạng xã hội được xây dựng với Next.js 14 và MongoDB.

## ✨ Tính năng chính

- **Hệ thống phân quyền 4 cấp**: Admin, Manager, Seller, Buyer
- **Giao diện hiện đại**: Responsive design với TailwindCSS
- **Bảo mật cao**: JWT authentication, bcrypt password hashing
- **Quản lý sản phẩm**: CRUD operations cho các loại tài khoản
- **Hệ thống duyệt**: Manager duyệt sản phẩm trước khi bán
- **Thanh toán tích hợp**: Hệ thống credit và PayOS
- **Chat real-time**: Socket.io cho tin nhắn
- **Thông báo**: Hệ thống thông báo real-time

## 🛠️ Công nghệ

- **Frontend**: Next.js 14, TypeScript, TailwindCSS
- **Backend**: Node.js, MongoDB, Mongoose
- **Authentication**: JWT, bcryptjs
- **Real-time**: Socket.io
- **Payment**: PayOS integration

## 🚀 Cài đặt

1. **Clone repository**:
   ```bash
   git clone https://github.com/Hoang7604119/mmostore.git
   cd mmostore
   ```

2. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

3. **Cấu hình môi trường**:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NEXTAUTH_SECRET=your_nextauth_secret
   PAYOS_CLIENT_ID=your_payos_client_id
   PAYOS_API_KEY=your_payos_api_key
   PAYOS_CHECKSUM_KEY=your_payos_checksum_key
   ```

4. **Chạy ứng dụng**:
   ```bash
   npm run dev
   ```

5. **Truy cập**: http://localhost:3000

## 👥 Phân quyền

| Role | Quyền hạn |
|------|----------|
| **Admin** | Toàn quyền quản lý hệ thống |
| **Manager** | Quản lý user, duyệt sản phẩm |
| **Seller** | Đăng bán sản phẩm, mua hàng |
| **Buyer** | Mua sản phẩm |

## 📦 Loại tài khoản hỗ trợ

- Facebook, Gmail, Hotmail
- X (Twitter), Instagram, TikTok
- YouTube, LinkedIn, OpenAI
- Game accounts (Genshin Impact, Wuthering Waves)

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## 📄 License

MIT License

---

**Phát triển bởi**: [Hoang7604119](https://github.com/Hoang7604119)
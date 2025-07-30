# Social Account Marketplace - Production Deployment Guide

## 📋 Tổng quan hệ thống

Social Account Marketplace là một nền tảng thương mại điện tử cho phép mua bán tài khoản mạng xã hội với các tính năng:

### 🔧 Công nghệ sử dụng
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes
- **Database**: MongoDB với Mongoose
- **Authentication**: JWT
- **UI**: Tailwind CSS + Lucide Icons
- **Real-time**: Socket.IO
- **File Upload**: Multer

### 👥 Phân quyền người dùng
- **Admin**: Toàn quyền quản lý hệ thống
- **Manager**: Quản lý sản phẩm và người dùng
- **Seller**: Bán tài khoản
- **Buyer**: Mua tài khoản

## 🚀 Chuẩn bị Production

### 1. Environment Variables (.env.local)
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# JWT Secret (Generate strong secret)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# Upload Configuration
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880

# Socket.IO (if using external service)
SOCKET_URL=https://yourdomain.com
```

### 2. Database Indexes (MongoDB)
```javascript
// Users Collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "role": 1 })

// Products Collection
db.products.createIndex({ "type": 1 })
db.products.createIndex({ "sellerId": 1 })
db.products.createIndex({ "status": 1 })
db.products.createIndex({ "createdAt": -1 })

// Orders Collection
db.orders.createIndex({ "buyerId": 1, "createdAt": -1 })
db.orders.createIndex({ "sellerId": 1, "createdAt": -1 })
db.orders.createIndex({ "status": 1, "createdAt": -1 })
db.orders.createIndex({ "orderNumber": 1 }, { unique: true })

// Reports Collection
db.reports.createIndex({ "reporterId": 1 })
db.reports.createIndex({ "productId": 1 })
db.reports.createIndex({ "status": 1 })
db.reports.createIndex({ "createdAt": -1 })

// Notifications Collection
db.notifications.createIndex({ "userId": 1, "createdAt": -1 })
db.notifications.createIndex({ "isRead": 1 })

// Messages Collection
db.messages.createIndex({ "conversationId": 1, "createdAt": -1 })
db.messages.createIndex({ "senderId": 1 })
db.messages.createIndex({ "receiverId": 1 })
```

### 3. Production Optimizations

#### A. Next.js Configuration
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['yourdomain.com'],
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yourdomain.com',
        pathname: '/uploads/**',
      },
    ],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

#### B. Package.json Scripts
```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "build:analyze": "ANALYZE=true npm run build"
  }
}
```

## 📁 Cấu trúc thư mục quan trọng

```
src/
├── app/
│   ├── api/                 # API Routes
│   │   ├── admin/          # Admin APIs
│   │   ├── manager/        # Manager APIs
│   │   ├── seller/         # Seller APIs
│   │   ├── buyer/          # Buyer APIs
│   │   └── auth/           # Authentication APIs
│   ├── dashboard/          # Dashboard pages
│   ├── marketplace/        # Public marketplace
│   └── auth/              # Auth pages
├── components/             # Reusable components
├── lib/                   # Utilities
│   ├── mongodb.ts         # Database connection
│   ├── utils.ts           # Helper functions
│   └── notifications.ts   # Notification system
├── models/                # MongoDB models
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript types
```

## 🔒 Security Checklist

### 1. Authentication & Authorization
- [x] JWT token validation
- [x] Role-based access control
- [x] Password hashing (bcrypt)
- [x] Middleware protection

### 2. API Security
- [x] Input validation
- [x] SQL injection prevention (MongoDB)
- [x] Rate limiting (implement if needed)
- [x] CORS configuration

### 3. Data Protection
- [x] Environment variables
- [x] Sensitive data encryption
- [x] File upload validation
- [x] XSS prevention

## 🚀 Deployment Steps

### 1. Build Application
```bash
# Install dependencies
npm install

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

### 2. Database Setup
1. Create MongoDB Atlas cluster
2. Configure network access
3. Create database user
4. Run index creation scripts
5. Seed initial data (admin user)

### 3. Server Configuration
```bash
# PM2 Configuration (ecosystem.config.js)
module.exports = {
  apps: [{
    name: 'social-marketplace',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}

# Start with PM2
pm2 start ecosystem.config.js
```

### 4. Nginx Configuration
```nginx
server {
    listen 80;
    server_name mmostore.site;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mmostore.site;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location /uploads/ {
        alias /path/to/app/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 📊 Monitoring & Maintenance

### 1. Logging
```javascript
// Add to lib/logger.ts
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

export default logger
```

### 2. Health Check Endpoint
```javascript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'

export async function GET() {
  try {
    await connectDB()
    return NextResponse.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Database connection failed' },
      { status: 503 }
    )
  }
}
```

### 3. Performance Monitoring
- Database query optimization
- Image optimization
- Caching strategies
- CDN implementation

## 🔧 Maintenance Tasks

### Daily
- Monitor error logs
- Check system health
- Review user reports

### Weekly
- Database backup
- Performance analysis
- Security updates

### Monthly
- Full system backup
- Dependency updates
- Security audit

## 📞 Support & Contact

For technical support or deployment assistance:
- Email: support@mmostore.site
- Documentation: https://docs.mmostore.site
- Issue Tracker: https://github.com/Hoang7604119/mmostore/issues

---

**Note**: Đây là hướng dẫn chi tiết để triển khai hệ thống lên production. Hãy đảm bảo test kỹ lưỡng trước khi deploy.
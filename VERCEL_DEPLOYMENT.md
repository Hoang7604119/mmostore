# Vercel Deployment Guide for MMO Store

## 🚀 Socket.IO Configuration for Vercel

### ⚠️ Important Notes
- Vercel has limitations with Socket.IO due to serverless architecture
- For full Socket.IO functionality, consider using:
  - Railway
  - Render
  - DigitalOcean App Platform
  - Traditional VPS hosting

### 🔧 Environment Variables for Vercel

Add these environment variables in Vercel Dashboard:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name

# Authentication
NEXTAUTH_URL=https://your-vercel-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key
JWT_SECRET=your-super-secure-jwt-secret-key

# Application
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
NODE_ENV=production

# PayOS Payment
PAYOS_CLIENT_ID=e903742c-1c37-416b-9c10-bb7d8af8d765
PAYOS_API_KEY=98adda5d-2b6a-4acb-8da3-4e30fbee8052
PAYOS_CHECKSUM_KEY=a51e671a08b1b5356eb2294b823851cf0d21659bbe11bf43c0d3479f55ed21a3

# Optional: Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@mmostore.site
```

### 📝 Deployment Steps

1. **Connect GitHub Repository**
   - Go to Vercel Dashboard
   - Import your GitHub repository
   - Select the main branch

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run vercel-build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Add Environment Variables**
   - Copy all variables from above
   - Make sure to update URLs to your Vercel domain

4. **Deploy**
   - Click Deploy
   - Wait for build to complete

### 🔄 Socket.IO Limitations on Vercel

**What works:**
- REST API endpoints
- Database operations
- Authentication
- Payment processing
- File uploads (with limitations)

**What has limitations:**
- Real-time messaging (Socket.IO)
- Live notifications
- Typing indicators
- Real-time updates

### 🛠️ Alternative Solutions

#### Option 1: Use Vercel for Frontend + External Socket.IO Service
- Deploy Next.js app on Vercel
- Use Socket.IO service like:
  - Pusher
  - Ably
  - Socket.IO Cloud

#### Option 2: Hybrid Deployment
- Frontend: Vercel
- Backend + Socket.IO: Railway/Render
- Database: MongoDB Atlas

#### Option 3: Full Platform Migration
- Railway (Recommended)
- Render
- DigitalOcean App Platform

### 🔧 Code Changes for Vercel

If deploying to Vercel, you may need to disable Socket.IO features:

```typescript
// In useSocket.ts
const ENABLE_SOCKET = process.env.NEXT_PUBLIC_ENABLE_SOCKET === 'true'

if (!ENABLE_SOCKET) {
  // Fallback to polling-based updates
  // Use setInterval to check for new messages
}
```

Add to environment variables:
```env
NEXT_PUBLIC_ENABLE_SOCKET=false
```

### 📊 Performance Considerations

- Vercel functions have 10-second timeout
- Cold starts may affect Socket.IO connections
- Consider implementing fallback mechanisms

### 🎯 Recommended Deployment Strategy

1. **For MVP/Testing**: Use Vercel with Socket.IO disabled
2. **For Production**: Use Railway or Render for full functionality

### 📞 Support

For deployment issues:
- Check Vercel function logs
- Monitor database connections
- Test API endpoints individually

---

**Note**: This guide assumes you want to deploy on Vercel despite Socket.IO limitations. For full functionality, consider alternative platforms.
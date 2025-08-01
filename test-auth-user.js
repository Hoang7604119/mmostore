require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connections[0].readyState) {
    return
  }
  
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    throw error
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  credit: Number
})

const User = mongoose.models.User || mongoose.model('User', userSchema)

async function testAuthUser() {
  try {
    await connectDB()
    console.log('Connected to database')
    
    // Tìm user hoangmanager
    const user = await User.findOne({ username: 'hoangmanager' })
    if (!user) {
      console.log('User hoangmanager not found')
      return
    }
    
    console.log('\n=== USER INFO ===')
    console.log('ID:', user._id.toString())
    console.log('Username:', user.username)
    console.log('Email:', user.email)
    console.log('Credit:', user.credit)
    
    // Tạo token giả định
    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )
    
    console.log('\n=== TOKEN INFO ===')
    console.log('Generated token:', token.substring(0, 50) + '...')
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    console.log('Decoded token:', decoded)
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

testAuthUser()
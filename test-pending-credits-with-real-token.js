require('dotenv').config({ path: '.env.local' })
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const fetch = require('node-fetch')

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

async function testPendingCreditsAPI() {
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
    
    // Tạo token thật
    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )
    
    console.log('\n=== TESTING API ===')
    
    // Test API với token thật
    const response = await fetch('http://localhost:3000/api/user/pending-credits', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `token=${token}`
      }
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const data = await response.text()
    console.log('Response body:', data)
    
    if (response.ok) {
      try {
        const jsonData = JSON.parse(data)
        console.log('\n=== PARSED RESPONSE ===')
        console.log('Success:', jsonData.success)
        console.log('Pending Credits Count:', jsonData.data?.pendingCredits?.length || 0)
        console.log('Summary:', jsonData.data?.summary)
        
        if (jsonData.data?.pendingCredits?.length > 0) {
          console.log('\n=== PENDING CREDITS ===')
          jsonData.data.pendingCredits.forEach((credit, index) => {
            console.log(`${index + 1}. Amount: ${credit.amount}, Status: ${credit.status}, Reason: ${credit.reason}`)
          })
        }
      } catch (parseError) {
        console.log('Failed to parse JSON response')
      }
    }
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

testPendingCreditsAPI()
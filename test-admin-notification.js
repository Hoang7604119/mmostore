// Test script to check admin users and test withdrawal notification
const { MongoClient } = require('mongodb')
const bcrypt = require('bcryptjs')

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social_marketplace'

async function testAdminNotification() {
  let client
  
  try {
    console.log('Connecting to MongoDB...')
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    
    const db = client.db()
    const usersCollection = db.collection('users')
    
    // Check if admin users exist
    console.log('\n=== Checking Admin Users ===')
    const adminUsers = await usersCollection.find({ 
      role: 'admin',
      isActive: true 
    }).toArray()
    
    console.log(`Found ${adminUsers.length} active admin users:`)
    adminUsers.forEach((admin, index) => {
      console.log(`${index + 1}. Username: ${admin.username}, Email: ${admin.email}, ID: ${admin._id}`)
    })
    
    if (adminUsers.length === 0) {
      console.log('\n❌ No active admin users found!')
      console.log('Creating default admin user...')
      
      // Create default admin user
      const defaultAdminPassword = await bcrypt.hash('admin123', 12)
      
      const adminUser = {
        username: 'admin',
        email: 'admin@example.com',
        password: defaultAdminPassword,
        role: 'admin',
        isActive: true,
        credit: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await usersCollection.insertOne(adminUser)
      console.log(`✅ Admin user created with ID: ${result.insertedId}`)
      console.log('Login credentials:')
      console.log('Email: admin@example.com')
      console.log('Password: admin123')
    } else {
      console.log('✅ Admin users found and active')
    }
    
    // Check all users by role
    console.log('\n=== User Statistics ===')
    const userStats = await usersCollection.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          }
        }
      }
    ]).toArray()
    
    userStats.forEach(stat => {
      console.log(`${stat._id}: ${stat.active}/${stat.count} active`)
    })
    
    // Test notification query
    console.log('\n=== Testing Notification Query ===')
    const notificationTargets = await usersCollection.find({ 
      role: 'admin',
      isActive: true 
    }, {
      projection: { _id: 1, username: 1, email: 1, role: 1, isActive: 1 }
    }).toArray()
    
    console.log('Users that would receive withdrawal notifications:')
    notificationTargets.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - ID: ${user._id}`)
    })
    
    if (notificationTargets.length === 0) {
      console.log('❌ No users would receive notifications!')
    } else {
      console.log(`✅ ${notificationTargets.length} admin(s) would receive notifications`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    if (client) {
      await client.close()
      console.log('\nDatabase connection closed.')
    }
  }
}

// Run the test
testAdminNotification().catch(console.error)
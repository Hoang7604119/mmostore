const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define schemas directly
const { Schema } = mongoose;

const PendingCreditSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
  releaseDate: { type: Date, required: true },
  actualReleaseDate: { type: Date },
  note: { type: String }
}, { timestamps: true });

const UserSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  credit: { type: Number, default: 0 },
  pendingCredit: { type: Number, default: 0 }
}, { timestamps: true });

const PendingCredit = mongoose.model('PendingCredit', PendingCreditSchema);
const User = mongoose.model('User', UserSchema);

async function checkPendingCredits() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    // Check all pending credits
    const pendingCredits = await PendingCredit.find({}).populate('userId', 'username email');
    console.log('\n=== ALL PENDING CREDITS ===');
    console.log('Total pending credits:', pendingCredits.length);
    
    if (pendingCredits.length > 0) {
      pendingCredits.forEach((pc, index) => {
        console.log(`\n${index + 1}. Pending Credit:`);
        console.log('  ID:', pc._id);
        console.log('  User:', pc.userId?.username || 'Unknown');
        console.log('  Amount:', pc.amount);
        console.log('  Status:', pc.status);
        console.log('  Reason:', pc.reason);
        console.log('  Release Date:', pc.releaseDate);
        console.log('  Created At:', pc.createdAt);
      });
    } else {
      console.log('No pending credits found');
    }
    
    // Check users with pending credit > 0
    const usersWithPendingCredit = await User.find({ pendingCredit: { $gt: 0 } }, {
      username: 1,
      email: 1,
      credit: 1,
      pendingCredit: 1
    });
    
    console.log('\n=== USERS WITH PENDING CREDIT > 0 ===');
    console.log('Total users with pending credit:', usersWithPendingCredit.length);
    
    if (usersWithPendingCredit.length > 0) {
      usersWithPendingCredit.forEach((user, index) => {
        console.log(`\n${index + 1}. User:`);
        console.log('  Username:', user.username);
        console.log('  Email:', user.email);
        console.log('  Available Credit:', user.credit);
        console.log('  Pending Credit:', user.pendingCredit);
      });
    } else {
      console.log('No users with pending credit found');
    }
    
    // Check summary statistics
    const stats = await PendingCredit.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);
    
    console.log('\n=== PENDING CREDITS STATISTICS ===');
    stats.forEach(stat => {
      console.log(`Status: ${stat._id}, Count: ${stat.count}, Total Amount: ${stat.totalAmount}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPendingCredits();
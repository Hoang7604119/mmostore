const mongoose = require('mongoose');
require('dotenv').config();

// Define Payment schema inline
const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderCode: {
    type: Number,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 10000,
    max: 50000000
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['payos', 'bank', 'ewallet'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  paymentUrl: {
    type: String
  },
  qrCode: {
    type: String
  },
  transactionId: {
    type: String
  }
}, {
  timestamps: true
});

const Payment = mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);

async function checkPayments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    const payments = await Payment.find({});
    console.log('Total payments:', payments.length);
    
    const matching = payments.filter(p => p.orderCode.toString().endsWith('83825113'));
    console.log('Payments ending with 83825113:', matching.length);
    
    matching.forEach(p => {
      console.log('FOUND MATCHING PAYMENT:', {
        orderCode: p.orderCode,
        status: p.status,
        amount: p.amount,
        userId: p.userId,
        createdAt: p.createdAt,
        paymentMethod: p.paymentMethod
      });
    });
    
    // Also check all pending payments
    const pendingPayments = await Payment.find({ status: 'pending' });
    console.log('\nPending payments:', pendingPayments.length);
    pendingPayments.forEach(p => {
      console.log('Pending:', {
        orderCode: p.orderCode,
        amount: p.amount,
        createdAt: p.createdAt
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPayments();

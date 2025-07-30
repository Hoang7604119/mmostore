// MongoDB initialization script
// This script runs when MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('social_marketplace');

// Create application user
db.createUser({
  user: 'app_user',
  pwd: 'app_password_change_in_production',
  roles: [
    {
      role: 'readWrite',
      db: 'social_marketplace'
    }
  ]
});

// Create indexes for better performance
print('Creating indexes...');

// Users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });
db.users.createIndex({ "createdAt": -1 });

// Products collection indexes
db.products.createIndex({ "type": 1 });
db.products.createIndex({ "sellerId": 1 });
db.products.createIndex({ "status": 1 });
db.products.createIndex({ "createdAt": -1 });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "pricePerUnit": 1 });
db.products.createIndex({ "title": "text", "description": "text" });

// Orders collection indexes
db.orders.createIndex({ "buyerId": 1, "createdAt": -1 });
db.orders.createIndex({ "sellerId": 1, "createdAt": -1 });
db.orders.createIndex({ "status": 1, "createdAt": -1 });
db.orders.createIndex({ "orderNumber": 1 }, { unique: true });
db.orders.createIndex({ "productId": 1 });

// Account items collection indexes
db.accountitems.createIndex({ "productId": 1 });
db.accountitems.createIndex({ "status": 1 });
db.accountitems.createIndex({ "orderId": 1 });
db.accountitems.createIndex({ "createdAt": -1 });

// Reports collection indexes
db.reports.createIndex({ "reporterId": 1 });
db.reports.createIndex({ "productId": 1 });
db.reports.createIndex({ "sellerId": 1 });
db.reports.createIndex({ "status": 1 });
db.reports.createIndex({ "reportType": 1 });
db.reports.createIndex({ "createdAt": -1 });
db.reports.createIndex({ "reporterId": 1, "productId": 1, "accountItemId": 1 }, { unique: true });

// Notifications collection indexes
db.notifications.createIndex({ "userId": 1, "createdAt": -1 });
db.notifications.createIndex({ "isRead": 1 });
db.notifications.createIndex({ "type": 1 });
db.notifications.createIndex({ "category": 1 });

// Messages collection indexes
db.messages.createIndex({ "conversationId": 1, "createdAt": -1 });
db.messages.createIndex({ "senderId": 1 });
db.messages.createIndex({ "receiverId": 1 });
db.messages.createIndex({ "isRead": 1 });

// Product types collection indexes
db.producttypes.createIndex({ "name": 1 }, { unique: true });
db.producttypes.createIndex({ "isActive": 1 });
db.producttypes.createIndex({ "order": 1 });

print('Indexes created successfully!');

// Insert default admin user
print('Creating default admin user...');

// Note: In production, change this password and use proper hashing
const bcrypt = require('bcryptjs');
const defaultAdminPassword = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uV.'; // 'admin123'

db.users.insertOne({
  username: 'admin',
  email: 'admin@example.com',
  password: defaultAdminPassword,
  role: 'admin',
  isActive: true,
  credit: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('Default admin user created!');
print('Email: admin@example.com');
print('Password: admin123');
print('Please change this password in production!');

// Insert default product types
print('Creating default product types...');

const defaultProductTypes = [
  {
    name: 'facebook',
    displayName: 'Facebook',
    color: '#1877F2',
    description: 'Tài khoản Facebook',
    order: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'gmail',
    displayName: 'Gmail',
    color: '#EA4335',
    description: 'Tài khoản Gmail',
    order: 2,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'instagram',
    displayName: 'Instagram',
    color: '#E4405F',
    description: 'Tài khoản Instagram',
    order: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'tiktok',
    displayName: 'TikTok',
    color: '#000000',
    description: 'Tài khoản TikTok',
    order: 4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'youtube',
    displayName: 'YouTube',
    color: '#FF0000',
    description: 'Tài khoản YouTube',
    order: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: 'x',
    displayName: 'X (Twitter)',
    color: '#000000',
    description: 'Tài khoản X (Twitter)',
    order: 6,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

db.producttypes.insertMany(defaultProductTypes);

print('Default product types created!');
print('Database initialization completed successfully!');
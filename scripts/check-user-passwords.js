const mongoose = require('mongoose');
const User = require('../models/user');

async function checkUserPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AMS');
    console.log('Connected to MongoDB');
    
    const users = await User.find({}, { email: 1, password: 1, role: 1 });
    
    console.log('\nUsers in database:');
    users.forEach(user => {
      const isHashed = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Password: ${user.password.substring(0, 20)}...`);
      console.log(`Is Hashed: ${isHashed}`);
      console.log('---');
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
}

checkUserPasswords();
const mongoose = require('mongoose');
const User = require('../models/user');

async function verifyAllUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AMS');
    console.log('Connected to MongoDB');
    
    // Update all users to be verified
    const result = await User.updateMany(
      { isVerified: false },
      { $set: { isVerified: true } }
    );
    
    console.log(`✓ Updated ${result.modifiedCount} users to verified status`);
    
    // Show updated users
    const users = await User.find({}, { email: 1, role: 1, isVerified: 1 });
    
    console.log('\nAll users are now verified:');
    users.forEach(user => {
      console.log(`${user.email} (${user.role}) - Verified: ${user.isVerified}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

verifyAllUsers();
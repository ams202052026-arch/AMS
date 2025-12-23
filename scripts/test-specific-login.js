const mongoose = require('mongoose');
const User = require('../models/user');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AMS');
    console.log('Connected to MongoDB');
    
    const email = 'alphi.fidelino@lspu.edu.ph';
    const password = 'alphi112411123';
    
    console.log(`Testing login for: ${email}`);
    console.log(`With password: ${password}`);
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('✓ User found:', user.email);
    console.log('✓ Role:', user.role);
    console.log('✓ Verified:', user.isVerified);
    console.log('✓ Active:', user.isActive);
    console.log('✓ Banned:', user.isBanned);
    console.log('✓ Locked:', user.isLocked());
    
    // Check password
    const isPasswordValid = password === user.password;
    console.log('✓ Password match:', isPasswordValid);
    
    if (isPasswordValid) {
      console.log('🎉 LOGIN SHOULD WORK!');
    } else {
      console.log('❌ Password mismatch');
      console.log('Expected:', password);
      console.log('Actual:', user.password);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testLogin();
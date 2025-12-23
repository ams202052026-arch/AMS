const mongoose = require('mongoose');
const User = require('../models/user');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AMS');
    console.log('Connected to MongoDB');
    
    // Test with a known user
    const email = 'ryan.nigga@gmail.com'; // Replace with your email
    const password = 'alphi123!'; // Replace with your password
    
    console.log(`\nTesting login for: ${email}`);
    console.log(`Password: ${password}`);
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log(`✓ User found: ${user.email}`);
    console.log(`✓ Role: ${user.role}`);
    console.log(`✓ Is Active: ${user.isActive}`);
    console.log(`✓ Is Verified: ${user.isVerified}`);
    console.log(`✓ Is Banned: ${user.isBanned}`);
    console.log(`✓ Login Attempts: ${user.loginAttempts}`);
    console.log(`✓ Is Locked: ${user.isLocked()}`);
    
    // Check password
    console.log(`\nPassword Check:`);
    console.log(`Input password: "${password}"`);
    console.log(`Stored password: "${user.password}"`);
    console.log(`Passwords match: ${password === user.password}`);
    
    // Check verification requirement
    if ((user.role === 'customer' || user.role === 'business_owner') && !user.isVerified) {
      console.log('❌ User needs email verification');
    } else {
      console.log('✓ Verification check passed');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testLogin();
const mongoose = require('mongoose');
const User = require('../models/user');

async function unlockUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AMS');
    console.log('Connected to MongoDB');
    
    const email = 'alphi.fidelino@lspu.edu.ph';
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('User status:');
    console.log('- Email:', user.email);
    console.log('- Login attempts:', user.loginAttempts);
    console.log('- Lock until:', user.lockUntil);
    console.log('- Is locked:', user.isLocked());
    
    if (user.isLocked()) {
      console.log('\n🔓 Unlocking user account...');
      
      await user.resetLoginAttempts();
      
      console.log('✓ Account unlocked successfully!');
      
      // Verify unlock
      const updatedUser = await User.findOne({ email: email.toLowerCase() });
      console.log('- New login attempts:', updatedUser.loginAttempts);
      console.log('- New lock status:', updatedUser.isLocked());
    } else {
      console.log('✓ Account is not locked');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

unlockUser();
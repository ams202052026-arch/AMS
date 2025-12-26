require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

// Cloud MongoDB connection string
const CLOUD_MONGODB_URI = 'mongodb+srv://ams202052026_db_user:w3Gk!un8qe_R.qH@ams.n548sg2.mongodb.net/AMS?retryWrites=true&w=majority&appName=AMS';

async function setupCloudSuperAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(CLOUD_MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Check if Super Admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin already exists in cloud database');
      console.log('📧 Email:', existingSuperAdmin.email);
      console.log('👤 Name:', existingSuperAdmin.name);
      
      // Ask if want to update password
      console.log('\n🔄 Updating Super Admin password...');
      const hashedPassword = await bcrypt.hash('XkR9mP2vL7nQ4wB8jF6hT3yD5sG1cN0zA', 10);
      existingSuperAdmin.password = hashedPassword;
      await existingSuperAdmin.save();
      console.log('✅ Super Admin password updated successfully!');
    } else {
      console.log('📝 Creating new Super Admin...');
      
      const hashedPassword = await bcrypt.hash('XkR9mP2vL7nQ4wB8jF6hT3yD5sG1cN0zA', 10);
      
      const superAdmin = new User({
        name: 'Super Admin',
        email: 'ams202052026@gmail.com',
        password: hashedPassword,
        role: 'superadmin',
        isVerified: true,
        verificationToken: null
      });

      await superAdmin.save();
      console.log('✅ Super Admin created successfully!');
    }

    console.log('\n📋 Super Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: ams202052026@gmail.com');
    console.log('🔑 Password: XkR9mP2vL7nQ4wB8jF6hT3yD5sG1cN0zA');
    console.log('🔗 Admin Access: https://ams1-a4h7.onrender.com/admin/access');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await mongoose.connection.close();
    console.log('\n✅ Done! Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupCloudSuperAdmin();

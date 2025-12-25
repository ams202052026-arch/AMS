require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');

async function updateSuperAdminPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Generate super random long password
        const newPassword = 'XkR9mP2vL7nQ4wB8jF6hT3yD5sG1cN0zA';
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const result = await User.updateOne(
            { email: 'ams202052026@gmail.com' },
            { $set: { password: hashedPassword } }
        );

        if (result.modifiedCount > 0) {
            console.log('\n✅ Super Admin password updated successfully!');
            console.log('\n📧 Email: superadmin@ams.com');
            console.log('🔑 New Password:', newPassword);
            console.log('\n⚠️  IMPORTANT: Save this password securely!\n');
        } else {
            console.log('❌ No Super Admin found or password already set');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateSuperAdminPassword();

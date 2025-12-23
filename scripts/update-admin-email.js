require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/admin');

async function updateAdminEmail() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the existing admin
        const admin = await Admin.findOne();
        
        if (!admin) {
            console.log('No admin found. Creating new admin...');
            const newAdmin = new Admin({
                username: 'admin',
                password: 'admin123',
                email: 'ams202052026@gmail.com'
            });
            await newAdmin.save();
            console.log('✅ New admin created with email: ams202052026@gmail.com');
        } else {
            // Update existing admin email
            admin.email = 'ams202052026@gmail.com';
            await admin.save();
            console.log('✅ Admin email updated to: ams202052026@gmail.com');
            console.log('Admin details:');
            console.log('  Username:', admin.username);
            console.log('  Email:', admin.email);
        }

        await mongoose.connection.close();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

updateAdminEmail();

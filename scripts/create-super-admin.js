const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

async function createSuperAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // Check if super admin already exists
        const existing = await User.findOne({ email: 'ams202052026@gmail.com' });
        
        if (existing) {
            console.log('⚠️  Super admin already exists!');
            console.log('Email:', existing.email);
            console.log('Role:', existing.role);
            process.exit(0);
        }
        
        // Create super admin
        const superAdmin = await User.create({
            firstName: 'AMS',
            lastName: 'Admin',
            email: 'ams202052026@gmail.com',
            password: 'YvoneAms@2025',
            role: 'super_admin',
            isVerified: true,
            isActive: true
        });
        
        console.log('✅ Super Admin created successfully!\n');
        console.log('📧 Email:', superAdmin.email);
        console.log('🔑 Password: YvoneAms@2025');
        console.log('👤 Role:', superAdmin.role);
        console.log('\n🔗 Access Link:');
        console.log('http://localhost:3000/admin/secure-access?token=sa_7f8e9d2c4b6a1e5f3d8c9b4a7e6f2d1c8b5a4e3f2d1c9b8a7e6f5d4c3b2a1e0f');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createSuperAdmin();

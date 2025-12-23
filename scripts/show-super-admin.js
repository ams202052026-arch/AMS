/**
 * Show Super Admin Credentials
 * Run this to see your super admin login details
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

async function showSuperAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Find super admin
        const superAdmin = await User.findOne({ role: 'super_admin' });

        if (!superAdmin) {
            console.log('❌ No super admin found in database');
            console.log('\nTo create one, run:');
            console.log('POST http://localhost:3000/admin/setup');
            process.exit(0);
        }

        console.log('✅ Super Admin Found!\n');
        console.log('='.repeat(50));
        console.log('LOGIN CREDENTIALS:');
        console.log('='.repeat(50));
        console.log(`Email:    ${superAdmin.email}`);
        console.log(`Password: ${superAdmin.password}`);
        console.log(`Name:     ${superAdmin.fullName}`);
        console.log(`Status:   ${superAdmin.isActive ? 'Active' : 'Inactive'}`);
        console.log(`Verified: ${superAdmin.isVerified ? 'Yes' : 'No'}`);
        console.log('='.repeat(50));
        console.log('\nLogin URL: http://localhost:3000/admin/login\n');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

showSuperAdmin();

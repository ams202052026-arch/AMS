/**
 * Fix Test User Role
 * Change test user from business_owner to customer so they can switch modes
 */

const mongoose = require('mongoose');
const User = require('../models/user');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AMS');

async function fixTestUserRole() {
    try {
        console.log('🔧 Fixing test user role...');

        // Find test user
        const testUser = await User.findOne({ email: 'testbusiness@example.com' });
        if (!testUser) {
            console.log('❌ Test user not found');
            return;
        }

        console.log('Current role:', testUser.role);

        // Update role to customer
        testUser.role = 'customer';
        await testUser.save();

        console.log('✅ Test user role updated to customer');
        console.log('   Email:', testUser.email);
        console.log('   Role:', testUser.role);
        console.log('   Now they can switch between customer and business modes');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

fixTestUserRole();
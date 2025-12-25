const User = require('../models/user');
const Business = require('../models/business');
const mongoose = require('mongoose');
require('dotenv').config();

async function testUsersPage() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Test the query used in the controller
        const query = { role: { $ne: 'super_admin' } };
        
        const totalUsers = await User.countDocuments(query);
        console.log('\n📊 Total users (excluding super_admin):', totalUsers);

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .limit(5);

        console.log('\n👥 Sample users:');
        for (const user of users) {
            const business = await Business.findOne({ ownerId: user._id });
            console.log(`  - ${user.fullName} (${user.email})`);
            console.log(`    Role: ${user.role}`);
            console.log(`    Active: ${user.isActive}, Banned: ${user.isBanned}`);
            console.log(`    Has Business: ${!!business}`);
        }

        // Test stats calculation
        const stats = {
            totalCustomers: await User.countDocuments({ role: 'customer' }),
            totalBusinessOwners: await User.countDocuments({ role: 'business_owner' }),
            activeUsers: await User.countDocuments({ role: { $ne: 'super_admin' }, isActive: true, isBanned: false }),
            bannedUsers: await User.countDocuments({ role: { $ne: 'super_admin' }, isBanned: true })
        };

        console.log('\n📈 Stats:');
        console.log('  Total Customers:', stats.totalCustomers);
        console.log('  Total Business Owners:', stats.totalBusinessOwners);
        console.log('  Active Users:', stats.activeUsers);
        console.log('  Banned Users:', stats.bannedUsers);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testUsersPage();

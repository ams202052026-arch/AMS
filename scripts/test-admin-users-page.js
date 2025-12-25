/**
 * Test Admin Users Page
 * Tests the /admin/users route to see what data is being passed
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Business = require('../models/business');

async function testUsersPage() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        // Simulate the controller logic
        const page = 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        
        // Build query
        let query = { role: { $ne: 'super_admin' } };
        
        // Get users with pagination
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        console.log(`\n✓ Found ${users.length} users`);
        
        // For each user, check if they have a business
        const usersWithBusinessInfo = await Promise.all(users.map(async (user) => {
            const business = await Business.findOne({ ownerId: user._id });
            return {
                ...user.toObject(),
                hasBusiness: !!business,
                businessStatus: business?.verificationStatus || null
            };
        }));
        
        console.log('\nUser Details:');
        usersWithBusinessInfo.forEach(user => {
            console.log(`- ${user.fullName || `${user.firstName} ${user.lastName}`} (${user.email})`);
            console.log(`  Role: ${user.role}`);
            console.log(`  Status: ${user.isActive ? 'Active' : 'Inactive'}, Banned: ${user.isBanned}`);
            console.log(`  Has Business: ${user.hasBusiness}`);
        });
        
        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);
        
        // Get statistics
        const stats = {
            totalCustomers: await User.countDocuments({ role: 'customer' }),
            totalBusinessOwners: await User.countDocuments({ role: 'business_owner' }),
            customersWithBusiness: (await Promise.all(
                (await User.find({ role: 'customer' })).map(async u => {
                    const b = await Business.findOne({ ownerId: u._id });
                    return !!b;
                })
            )).filter(Boolean).length,
            activeUsers: await User.countDocuments({ role: { $ne: 'super_admin' }, isActive: true, isBanned: false }),
            bannedUsers: await User.countDocuments({ role: { $ne: 'super_admin' }, isBanned: true })
        };
        
        console.log('\nStatistics:');
        console.log(`- Total Customers: ${stats.totalCustomers}`);
        console.log(`- Total Business Owners: ${stats.totalBusinessOwners}`);
        console.log(`- Customers with Business: ${stats.customersWithBusiness}`);
        console.log(`- Active Users: ${stats.activeUsers}`);
        console.log(`- Banned Users: ${stats.bannedUsers}`);
        
        console.log(`\nPagination: Page ${page} of ${totalPages} (${totalUsers} total users)`);
        
        // Check if fullName virtual is working
        console.log('\nTesting fullName virtual:');
        const testUser = users[0];
        if (testUser) {
            console.log(`- Direct access: ${testUser.fullName}`);
            console.log(`- After toObject: ${usersWithBusinessInfo[0].fullName}`);
        }
        
    } catch (error) {
        console.error('✗ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
}

testUsersPage();

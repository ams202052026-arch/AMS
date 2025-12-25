const mongoose = require('mongoose');
const User = require('../models/user');
const Business = require('../models/business');
require('dotenv').config();

async function testUsersPageData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Simulate the exact controller logic
        const page = 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        
        const role = 'all';
        const status = 'all';
        const search = '';
        const hasBusinessFilter = 'all';
        
        let query = { role: { $ne: 'super_admin' } };
        
        console.log('📋 Query:', JSON.stringify(query, null, 2));
        
        // Get users with pagination
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        console.log(`\n✓ Found ${users.length} users\n`);
        
        // For each user, check if they have a business
        const usersWithBusinessInfo = await Promise.all(users.map(async (user) => {
            const business = await Business.findOne({ ownerId: user._id });
            return {
                ...user.toObject(),
                hasBusiness: !!business,
                businessStatus: business?.verificationStatus || null
            };
        }));
        
        console.log('👥 Users with business info:');
        usersWithBusinessInfo.forEach(u => {
            console.log(`  - ${u.fullName} (${u.email})`);
            console.log(`    Has Business: ${u.hasBusiness}`);
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
        
        console.log('\n📈 Stats:', stats);
        console.log('\n📄 Pagination:');
        console.log('  Current Page:', page);
        console.log('  Total Pages:', totalPages);
        console.log('  Total Users:', totalUsers);
        
        console.log('\n✅ All data looks good!');
        console.log('\nNow testing if the view can render...');
        
        // Check if view file exists
        const fs = require('fs');
        const path = require('path');
        const viewPath = path.join(__dirname, '../views/admin/users/list-redesign.ejs');
        
        if (fs.existsSync(viewPath)) {
            console.log('✓ View file exists:', viewPath);
            
            // Try to render with ejs
            const ejs = require('ejs');
            const viewContent = fs.readFileSync(viewPath, 'utf8');
            
            try {
                const html = ejs.render(viewContent, {
                    users: usersWithBusinessInfo,
                    stats,
                    currentPage: page,
                    totalPages,
                    totalUsers,
                    filters: { role, status, search, hasBusiness: hasBusinessFilter }
                });
                
                console.log('✓ View rendered successfully!');
                console.log('  HTML length:', html.length, 'bytes');
                
                if (html.length < 1000) {
                    console.log('\n⚠️  HTML is suspiciously short!');
                    console.log('Content:', html.substring(0, 500));
                } else {
                    console.log('✓ HTML looks good');
                }
            } catch (renderError) {
                console.error('\n❌ View rendering error:', renderError.message);
                console.error('Stack:', renderError.stack);
            }
        } else {
            console.error('❌ View file not found:', viewPath);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testUsersPageData();

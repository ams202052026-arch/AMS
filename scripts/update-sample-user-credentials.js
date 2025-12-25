const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Business = require('../models/business');

async function updateSampleUserCredentials() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find Sample User
        const sampleUser = await User.findOne({ email: 'sample.user@gmail.com' });
        
        if (!sampleUser) {
            console.log('❌ Sample User not found');
            return;
        }

        console.log('👤 Sample User Found:');
        console.log('   Email:', sampleUser.email);
        console.log('   Current Password:', sampleUser.password);
        console.log('   ID:', sampleUser._id);
        console.log('');

        // Update password
        console.log('🔑 Updating password...');
        sampleUser.password = 'sampleUser123!';
        await sampleUser.save();
        console.log('   ✓ Password updated to: sampleUser123!');
        console.log('');

        // Find and update business
        const business = await Business.findOne({ ownerId: sampleUser._id });
        
        if (!business) {
            console.log('❌ No business found for this user');
            return;
        }

        console.log('🏢 Business Found:');
        console.log('   Current Name:', business.businessName);
        console.log('   ID:', business._id);
        console.log('');

        // Update business name
        console.log('📝 Updating business name...');
        business.businessName = 'Sample Business';
        await business.save();
        console.log('   ✓ Business name updated to: Sample Business');
        console.log('');

        console.log('✅ UPDATE COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Sample User Credentials:');
        console.log('   Email: sample.user@gmail.com');
        console.log('   Password: sampleUser123!');
        console.log('   Business: Sample Business');
        console.log('');
        console.log('You can now login with these credentials!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

updateSampleUserCredentials();

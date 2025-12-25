const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Business = require('../models/business');

async function findTestingRegisterOwner() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Check all users and their businesses
        const users = await User.find({ role: 'customer' });
        
        console.log('📋 Checking all customer accounts:\n');
        
        for (const user of users) {
            const businesses = await Business.find({ ownerId: user._id });
            
            console.log(`📧 ${user.email}`);
            console.log(`   Name: ${user.firstName} ${user.lastName}`);
            console.log(`   User ID: ${user._id}`);
            console.log(`   Businesses: ${businesses.length}`);
            
            if (businesses.length > 0) {
                businesses.forEach(biz => {
                    console.log(`      - ${biz.businessName} (${biz.verificationStatus})`);
                });
            } else {
                console.log(`      - No businesses`);
            }
            console.log('');
        }

        // Also check for any orphaned business (no owner)
        const orphanedBusinesses = await Business.find({ ownerId: null });
        if (orphanedBusinesses.length > 0) {
            console.log('⚠️  Orphaned Businesses (no owner):');
            orphanedBusinesses.forEach(biz => {
                console.log(`   - ${biz.businessName} (${biz.verificationStatus})`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
}

findTestingRegisterOwner();

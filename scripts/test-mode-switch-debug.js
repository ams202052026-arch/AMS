/**
 * Debug Mode Switch Issue
 * Test the API endpoints directly
 */

const mongoose = require('mongoose');
const User = require('../models/user');
const Business = require('../models/business');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AMS');

async function debugModeSwitch() {
    try {
        console.log('🔍 Debugging mode switch issue...');

        // Find test user
        const testUser = await User.findOne({ email: 'testbusiness@example.com' });
        if (!testUser) {
            console.log('❌ Test user not found');
            return;
        }

        console.log('✅ Test user found:');
        console.log('   ID:', testUser._id);
        console.log('   Email:', testUser.email);
        console.log('   Role:', testUser.role);
        console.log('   BusinessId field:', testUser.businessId);

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: testUser._id });
        if (!business) {
            console.log('❌ No business found for user');
            return;
        }

        console.log('✅ Business found:');
        console.log('   ID:', business._id);
        console.log('   Name:', business.businessName);
        console.log('   Status:', business.verificationStatus);
        console.log('   Owner ID:', business.ownerId);

        // Check if business is approved
        if (business.verificationStatus === 'approved') {
            console.log('✅ Business is approved - should redirect to /business-owner/dashboard');
        } else {
            console.log('❌ Business not approved:', business.verificationStatus);
        }

        // Test what the API would return
        const apiResponse = {
            currentMode: 'customer',
            businessStatus: business.verificationStatus,
            canSwitchToBusiness: business.verificationStatus === 'approved',
            userRole: testUser.role,
            businessId: business._id,
            businessName: business.businessName
        };

        console.log('\n📡 API Response would be:');
        console.log(JSON.stringify(apiResponse, null, 2));

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

debugModeSwitch();
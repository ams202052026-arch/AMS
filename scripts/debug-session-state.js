/**
 * Debug Session State
 * Check the current session state for the test user
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Business = require('../models/business');

async function debugSessionState() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find the test customer account
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        if (!testUser) {
            console.log('❌ Test user not found');
            return;
        }

        console.log('✅ Test user found:', testUser.fullName);
        console.log('User ID:', testUser._id);
        console.log('User role:', testUser.role);

        // Find the business for this user
        const business = await Business.findOne({ ownerId: testUser._id });
        if (!business) {
            console.log('❌ Business not found for user');
            return;
        }

        console.log('✅ Business found:', business.businessName);
        console.log('Business ID:', business._id);
        console.log('Business verification status:', business.verificationStatus);

        // Check if the canAccessBusiness logic would work
        console.log('\n🔍 Testing canAccessBusiness logic:');
        
        // Simulate the middleware check
        const userId = testUser._id.toString();
        const userRole = testUser.role; // This should be 'customer'
        
        console.log('User ID:', userId);
        console.log('User role:', userRole);
        
        // Check if user is business_owner role
        if (userRole === 'business_owner') {
            console.log('✅ User has business_owner role - would allow access');
        } else if (userRole === 'customer') {
            console.log('User is customer, checking business approval...');
            
            // Check if they have approved business
            const approvedBusiness = await Business.findOne({ 
                ownerId: userId, 
                verificationStatus: 'approved' 
            });

            if (approvedBusiness) {
                console.log('✅ User has approved business - should allow access in business mode');
                console.log('Business name:', approvedBusiness.businessName);
            } else {
                console.log('❌ User does not have approved business');
            }
        }

        // The issue might be that currentMode is not being set properly
        console.log('\n💡 The issue is likely that currentMode session variable is not set');
        console.log('When you login and switch to business mode, the session should have:');
        console.log('- userId:', userId);
        console.log('- userRole: "customer"');
        console.log('- currentMode: "business"');
        
        console.log('\n🔧 To fix this, we need to ensure the mode switch sets currentMode properly');

    } catch (error) {
        console.error('❌ Debug failed:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

// Run the debug
debugSessionState();
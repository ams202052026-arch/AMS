/**
 * Check Suspension Details
 * Shows detailed suspension information
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Business = require('../models/business');
const User = require('../models/user');

async function checkSuspensionDetails() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const business = await Business.findOne({ verificationStatus: 'suspended' })
            .populate('ownerId', 'firstName lastName email');

        if (!business) {
            console.log('❌ No suspended businesses found');
            return;
        }

        console.log('📋 Suspended Business Details:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Business Name: ${business.businessName}`);
        console.log(`Owner: ${business.ownerId.firstName} ${business.ownerId.lastName}`);
        console.log(`Email: ${business.ownerId.email}`);
        console.log(`Status: ${business.verificationStatus}`);
        console.log(`Active: ${business.isActive}`);
        
        if (business.suspendedAt) {
            console.log(`Suspended At: ${business.suspendedAt.toLocaleString()}`);
        }
        
        if (business.suspensionReason) {
            console.log(`\n⚠️  Suspension Reason:`);
            console.log(`   ${business.suspensionReason}`);
        } else {
            console.log(`\n⚠️  Suspension Reason: Not provided`);
        }

        console.log('\n📝 Testing Instructions:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Login as the business owner:');
        console.log(`   Email: ${business.ownerId.email}`);
        console.log('2. Click "Switch to Business" button');
        console.log('3. Modal should show:');
        console.log('   - Status: Suspended (orange)');
        console.log('   - Business name: ' + business.businessName);
        if (business.suspensionReason) {
            console.log('   - Reason: ' + business.suspensionReason);
        }
        console.log('   - Warning message');
        console.log('   - "Close" button only');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

checkSuspensionDetails();

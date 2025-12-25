/**
 * Test Suspended Business Modal
 * Temporarily suspends a business to test the modal display
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Business = require('../models/business');
const User = require('../models/user');

async function testSuspendedModal() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find an approved business
        const business = await Business.findOne({ verificationStatus: 'approved' })
            .populate('ownerId', 'firstName lastName email');

        if (!business) {
            console.log('❌ No approved businesses found');
            console.log('💡 Create an approved business first to test suspension');
            return;
        }

        console.log('📋 Business Found:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Business Name: ${business.businessName}`);
        console.log(`Owner: ${business.ownerId.firstName} ${business.ownerId.lastName}`);
        console.log(`Email: ${business.ownerId.email}`);
        console.log(`Current Status: ${business.verificationStatus}`);

        // Temporarily suspend the business
        console.log('\n⚠️  Temporarily suspending business for testing...');
        
        const originalStatus = business.verificationStatus;
        const originalSuspensionReason = business.suspensionReason;
        const originalIsActive = business.isActive;

        business.verificationStatus = 'suspended';
        business.suspensionReason = 'Test suspension - This is a test to verify the suspended business modal displays correctly.';
        business.isActive = false;
        business.suspendedAt = new Date();
        await business.save();

        console.log('✅ Business suspended temporarily');
        console.log('\n📝 Test Instructions:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. Login as the business owner:');
        console.log(`   Email: ${business.ownerId.email}`);
        console.log('2. Click on "Switch to Business" button in the header');
        console.log('3. You should see a modal with:');
        console.log('   - Status: Suspended (in orange color)');
        console.log('   - Business name displayed');
        console.log('   - Suspension reason shown');
        console.log('   - Message to contact support');
        console.log('   - "Close" button only (no switch option)');
        console.log('\n4. After testing, run this script again to restore the business');

        console.log('\n⏳ Waiting 30 seconds before auto-restoring...');
        console.log('   (Press Ctrl+C to keep suspended for manual testing)');

        // Wait 30 seconds then restore
        await new Promise(resolve => setTimeout(resolve, 30000));

        console.log('\n🔄 Restoring business to original state...');
        business.verificationStatus = originalStatus;
        business.suspensionReason = originalSuspensionReason;
        business.isActive = originalIsActive;
        business.suspendedAt = null;
        await business.save();

        console.log('✅ Business restored to original state');
        console.log(`   Status: ${business.verificationStatus}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

testSuspendedModal();

/**
 * Test Business Actions
 * Tests all business management actions from the admin panel
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Business = require('../models/business');
const User = require('../models/user');

async function testBusinessActions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find a test business
        const business = await Business.findOne()
            .populate('ownerId', 'firstName lastName email')
            .sort({ createdAt: -1 });

        if (!business) {
            console.log('❌ No businesses found in database');
            return;
        }

        console.log('📋 Test Business Details:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Business Name: ${business.businessName}`);
        console.log(`Owner: ${business.ownerId.firstName} ${business.ownerId.lastName}`);
        console.log(`Email: ${business.ownerId.email}`);
        console.log(`Status: ${business.verificationStatus}`);
        console.log(`Active: ${business.isActive}`);
        console.log(`Created: ${business.createdAt.toLocaleDateString()}`);
        
        if (business.verificationDocuments && business.verificationDocuments.length > 0) {
            console.log(`\n📄 Documents: ${business.verificationDocuments.length} uploaded`);
            business.verificationDocuments.forEach((doc, index) => {
                console.log(`  ${index + 1}. ${doc.type || 'Document'}`);
                console.log(`     URL: ${doc.fileUrl ? '✅ Available' : '❌ Missing'}`);
            });
        } else {
            console.log('\n📄 Documents: None uploaded');
        }

        console.log('\n📍 Address:');
        console.log(`  ${business.address.street}`);
        console.log(`  ${business.address.barangay}, ${business.address.city}`);
        console.log(`  ${business.address.province}`);
        console.log(`  Postal Code: ${business.address.zipCode || 'N/A'}`);

        if (business.location && business.location.coordinates) {
            console.log(`\n🗺️  Location: [${business.location.coordinates[1]}, ${business.location.coordinates[0]}]`);
        }

        console.log('\n✅ Available Actions Based on Status:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (business.verificationStatus === 'pending') {
            console.log('✓ Approve Business');
            console.log('✓ Reject Business (requires reason)');
        }
        
        if (business.verificationStatus === 'approved') {
            console.log('✓ Suspend Business (requires reason)');
        }
        
        if (business.verificationStatus === 'suspended') {
            console.log('✓ Reactivate Business');
        }
        
        console.log('✓ Delete Business (always available)');

        if (business.rejectionReason) {
            console.log(`\n❌ Rejection Reason: ${business.rejectionReason}`);
        }

        if (business.suspensionReason) {
            console.log(`\n⚠️  Suspension Reason: ${business.suspensionReason}`);
        }

        console.log('\n📊 All Businesses Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        const pending = await Business.countDocuments({ verificationStatus: 'pending' });
        const approved = await Business.countDocuments({ verificationStatus: 'approved' });
        const rejected = await Business.countDocuments({ verificationStatus: 'rejected' });
        const suspended = await Business.countDocuments({ verificationStatus: 'suspended' });
        
        console.log(`Pending: ${pending}`);
        console.log(`Approved: ${approved}`);
        console.log(`Rejected: ${rejected}`);
        console.log(`Suspended: ${suspended}`);
        console.log(`Total: ${pending + approved + rejected + suspended}`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

testBusinessActions();

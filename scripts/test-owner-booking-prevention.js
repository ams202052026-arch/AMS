const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Business = require('../models/business');
const Service = require('../models/service');

async function testOwnerBookingPrevention() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find Sample User who owns LUMPIANG TANGA
        const sampleUser = await User.findOne({ email: 'sample.user@gmail.com' });
        
        if (!sampleUser) {
            console.log('❌ Sample User not found');
            return;
        }

        console.log('👤 Sample User Found:');
        console.log('   Name:', sampleUser.name);
        console.log('   Email:', sampleUser.email);
        console.log('   ID:', sampleUser._id);
        console.log('');

        // Find their business
        const business = await Business.findOne({ ownerId: sampleUser._id });
        
        if (!business) {
            console.log('❌ No business found for this user');
            return;
        }

        console.log('🏢 Business Found:');
        console.log('   Name:', business.businessName);
        console.log('   Owner ID:', business.ownerId);
        console.log('   Status:', business.verificationStatus);
        console.log('   Active:', business.isActive);
        console.log('');

        // Find services from this business
        const services = await Service.find({ businessId: business._id, isActive: true })
            .populate('businessId');
        
        console.log(`📋 Services from ${business.businessName}:`);
        if (services.length === 0) {
            console.log('   No active services found');
        } else {
            services.forEach((service, index) => {
                console.log(`   ${index + 1}. ${service.name} (₱${service.price})`);
                console.log(`      Service ID: ${service._id}`);
                console.log(`      Business Owner ID: ${service.businessId.ownerId}`);
                console.log(`      Sample User ID: ${sampleUser._id}`);
                console.log(`      IDs Match: ${service.businessId.ownerId.toString() === sampleUser._id.toString()}`);
            });
        }
        console.log('');

        // Test the filtering logic
        console.log('🧪 Testing Filter Logic:');
        const userId = sampleUser._id.toString();
        
        const shouldBeHidden = services.filter(service => {
            if (!service.businessId) return false;
            if (service.businessId.verificationStatus !== 'approved' || 
                service.businessId.isActive !== true) {
                return false;
            }
            // This is the logic that should hide own services
            if (userId && service.businessId.ownerId && 
                service.businessId.ownerId.toString() === userId) {
                return true; // Should be hidden
            }
            return false;
        });

        console.log(`   Services that SHOULD BE HIDDEN: ${shouldBeHidden.length}`);
        shouldBeHidden.forEach(s => console.log(`      - ${s.name}`));
        console.log('');

        // Find services from OTHER businesses
        const otherServices = await Service.find({ 
            businessId: { $ne: business._id },
            isActive: true 
        })
        .populate('businessId')
        .limit(5);

        console.log('📋 Services from OTHER businesses (should be visible):');
        if (otherServices.length === 0) {
            console.log('   No other services found');
        } else {
            otherServices.forEach((service, index) => {
                if (service.businessId) {
                    console.log(`   ${index + 1}. ${service.name} - ${service.businessId.businessName}`);
                    console.log(`      Owner ID: ${service.businessId.ownerId}`);
                    console.log(`      Different from Sample User: ${service.businessId.ownerId.toString() !== sampleUser._id.toString()}`);
                }
            });
        }
        console.log('');

        console.log('✅ TEST SUMMARY:');
        console.log(`   - Sample User owns: ${business.businessName}`);
        console.log(`   - Own services count: ${services.length}`);
        console.log(`   - These services SHOULD NOT appear in home page for this user`);
        console.log(`   - Other businesses' services SHOULD appear normally`);
        console.log('');
        console.log('🔍 To verify:');
        console.log('   1. Login as sample.user@gmail.com');
        console.log('   2. Go to home page');
        console.log(`   3. Services from "${business.businessName}" should NOT be visible`);
        console.log('   4. Services from other businesses should be visible');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

testOwnerBookingPrevention();

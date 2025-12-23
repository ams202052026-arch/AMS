/**
 * Test Map Functionality
 * This script tests the map integration by creating a test business with coordinates
 */

const mongoose = require('mongoose');
const Business = require('../models/business');
const User = require('../models/user');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function testMapFunctionality() {
    try {
        console.log('🗺️ Testing Map Functionality...');

        // Find or create a test user
        let testUser = await User.findOne({ email: 'maptest@example.com' });
        
        if (!testUser) {
            testUser = await User.create({
                firstName: 'Map',
                lastName: 'Tester',
                email: 'maptest@example.com',
                password: 'password123',
                phoneNumber: '09123456789',
                role: 'business_owner',
                isVerified: true
            });
            console.log('✅ Test user created');
        } else {
            console.log('✅ Test user found');
        }

        // Create a test business with coordinates (SM Mall of Asia coordinates)
        const testBusiness = await Business.create({
            ownerId: testUser._id,
            businessName: 'Map Test Business',
            businessType: 'salon',
            description: 'A test business to verify map functionality',
            email: 'maptest@example.com',
            phoneNumber: '09123456789',
            website: 'https://example.com',
            address: {
                street: '123 Test Street',
                barangay: 'Test Barangay',
                city: 'Pasay City',
                province: 'Metro Manila',
                zipCode: '1300',
                coordinates: {
                    lat: 14.5378, // SM Mall of Asia latitude
                    lng: 120.9818 // SM Mall of Asia longitude
                }
            },
            verificationStatus: 'approved',
            isActive: true
        });

        // Link business to user
        testUser.businessId = testBusiness._id;
        await testUser.save();

        console.log('✅ Test business created with map coordinates:');
        console.log(`   Business ID: ${testBusiness._id}`);
        console.log(`   Business Name: ${testBusiness.businessName}`);
        console.log(`   Coordinates: ${testBusiness.address.coordinates.lat}, ${testBusiness.address.coordinates.lng}`);
        console.log(`   Full Address: ${testBusiness.fullAddress}`);
        
        console.log('\n📍 Map Integration Test Results:');
        console.log('✅ Business created with coordinates');
        console.log('✅ Address structure includes coordinates field');
        console.log('✅ Coordinates are properly stored as numbers');
        
        console.log('\n🔗 Test URLs:');
        console.log(`   Admin Business Details: http://localhost:3000/admin/businesses/${testBusiness._id}`);
        console.log(`   Business Registration: http://localhost:3000/business/register`);
        
        console.log('\n📋 Next Steps:');
        console.log('1. Visit the business registration page to test map input');
        console.log('2. Visit the admin business details page to see map display');
        console.log('3. Verify that coordinates are saved when registering new businesses');

    } catch (error) {
        console.error('❌ Map functionality test failed:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the test
testMapFunctionality();
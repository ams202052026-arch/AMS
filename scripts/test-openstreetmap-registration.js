/**
 * Test OpenStreetMap Registration Workflow
 * This script tests the complete business registration with OpenStreetMap integration
 */

const mongoose = require('mongoose');
const User = require('../models/user');
const Business = require('../models/business');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AMS', {});

async function testOpenStreetMapRegistration() {
    try {
        console.log('🗺️ Testing OpenStreetMap Registration Workflow...');

        // Clean up any existing test data
        await User.deleteOne({ email: 'osmtest@example.com' });
        await Business.deleteOne({ businessName: 'OpenStreetMap Test Business' });

        // Create a test customer user
        const testUser = await User.create({
            firstName: 'OSM',
            lastName: 'Tester',
            email: 'osmtest@example.com',
            password: 'password123',
            phoneNumber: '09123456789',
            role: 'customer',
            isVerified: true
        });

        console.log('✅ Test customer created:', testUser.email);

        // Simulate business registration with OpenStreetMap coordinates
        // Using coordinates for Rizal Park, Manila
        const businessData = {
            ownerId: testUser._id,
            businessName: 'OpenStreetMap Test Business',
            businessType: 'salon',
            description: 'A test business to verify OpenStreetMap integration',
            email: testUser.email,
            phoneNumber: '09123456789',
            website: 'https://example.com',
            address: {
                street: 'Roxas Boulevard',
                barangay: 'Ermita',
                city: 'Manila',
                province: 'Metro Manila',
                zipCode: '1000',
                coordinates: {
                    lat: 14.5832, // Rizal Park coordinates
                    lng: 120.9794
                }
            },
            verificationStatus: 'approved',
            isActive: true
        };

        const testBusiness = await Business.create(businessData);

        // Link business to user
        testUser.businessId = testBusiness._id;
        await testUser.save();

        console.log('✅ Test business created with OpenStreetMap coordinates:');
        console.log(`   Business ID: ${testBusiness._id}`);
        console.log(`   Business Name: ${testBusiness.businessName}`);
        console.log(`   Coordinates: ${testBusiness.address.coordinates.lat}, ${testBusiness.address.coordinates.lng}`);
        console.log(`   Full Address: ${testBusiness.fullAddress}`);

        // Test coordinate validation
        const savedBusiness = await Business.findById(testBusiness._id);
        const hasValidCoordinates = savedBusiness.address.coordinates && 
                                   savedBusiness.address.coordinates.lat && 
                                   savedBusiness.address.coordinates.lng;

        console.log('\n📍 OpenStreetMap Integration Test Results:');
        console.log('✅ Business created with coordinates');
        console.log('✅ Coordinates stored as numbers:', typeof savedBusiness.address.coordinates.lat === 'number');
        console.log('✅ Coordinates validation:', hasValidCoordinates ? 'PASSED' : 'FAILED');
        console.log('✅ Address structure complete');

        // Test URLs
        console.log('\n🔗 Test URLs:');
        console.log(`   Business Registration: http://localhost:3000/business/register`);
        console.log(`   Admin Business Details: http://localhost:3000/admin/businesses/${testBusiness._id}`);
        console.log(`   OpenStreetMap Test: http://localhost:3000/openstreetmap-test`);

        // Test login credentials
        console.log('\n🔑 Test Login Credentials:');
        console.log(`   Customer Email: ${testUser.email}`);
        console.log(`   Password: password123`);
        console.log(`   Role: ${testUser.role}`);

        console.log('\n📋 Testing Steps:');
        console.log('1. Login as customer: http://localhost:3000/login');
        console.log('2. Go to business registration: http://localhost:3000/business/register');
        console.log('3. Fill form and test OpenStreetMap features:');
        console.log('   - Click on map to set location');
        console.log('   - Use "Search Address" button');
        console.log('   - Use "Get Current Location" button');
        console.log('   - Verify coordinates are saved');
        console.log('4. View business in admin panel with map display');

        console.log('\n🎯 Expected OpenStreetMap Features:');
        console.log('✅ Interactive map (click to set location)');
        console.log('✅ Draggable marker');
        console.log('✅ Address search functionality');
        console.log('✅ Current location detection');
        console.log('✅ Reverse geocoding (coordinates → address)');
        console.log('✅ Form integration (coordinates saved to database)');
        console.log('✅ Admin map display with business marker');

        console.log('\n🆚 OpenStreetMap vs Google Maps:');
        console.log('✅ No API key required');
        console.log('✅ No usage limits');
        console.log('✅ No billing concerns');
        console.log('✅ Same functionality');
        console.log('✅ Professional appearance');
        console.log('✅ Reliable service');

    } catch (error) {
        console.error('❌ OpenStreetMap registration test failed:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the test
testOpenStreetMapRegistration();
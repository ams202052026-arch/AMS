/**
 * Create Test Business Owner with Approved Business
 * This script creates a test account that can switch to business mode
 */

const mongoose = require('mongoose');
const User = require('../models/user');
const Business = require('../models/business');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AMS', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function createTestBusinessOwner() {
    try {
        console.log('🔍 Creating test business owner with approved business...');

        // Check if test user already exists
        const existingUser = await User.findOne({ email: 'testbusiness@example.com' });
        if (existingUser) {
            console.log('❌ Test business owner already exists');
            
            // Check if they have a business
            const existingBusiness = await Business.findOne({ ownerId: existingUser._id });
            if (existingBusiness) {
                console.log('✅ Business already exists:', existingBusiness.businessName);
                console.log('   Status:', existingBusiness.verificationStatus);
                
                // Update to approved if not already
                if (existingBusiness.verificationStatus !== 'approved') {
                    existingBusiness.verificationStatus = 'approved';
                    existingBusiness.verifiedAt = new Date();
                    await existingBusiness.save();
                    console.log('✅ Business status updated to approved');
                }
            } else {
                console.log('❌ User exists but no business found, creating business...');
                await createBusinessForUser(existingUser);
            }
            
            await mongoose.connection.close();
            return;
        }

        // Create test user (customer role first)
        const testUser = await User.create({
            firstName: 'Test',
            lastName: 'Business Owner',
            email: 'testbusiness@example.com',
            password: 'password123',
            phoneNumber: '+639123456789',
            role: 'customer', // Keep as customer so they can switch modes
            isVerified: true,
            isActive: true
        });

        console.log('✅ Test user created:', testUser.email);

        // Create approved business for the user
        await createBusinessForUser(testUser);

        console.log('\n🎉 Test business owner setup complete!');
        console.log('\n📋 Test Account Details:');
        console.log('   Email: testbusiness@example.com');
        console.log('   Password: password123');
        console.log('   Role: customer (can switch to business mode)');
        console.log('\n🧪 Testing Instructions:');
        console.log('1. Login with the test account');
        console.log('2. Click "Switch to Business" in header');
        console.log('3. Should redirect to business dashboard');
        console.log('4. Should see business management interface');

    } catch (error) {
        console.error('❌ Error creating test business owner:', error);
    } finally {
        await mongoose.connection.close();
    }
}

async function createBusinessForUser(user) {
    const testBusiness = await Business.create({
        ownerId: user._id,
        businessName: 'Test Beauty Salon',
        businessType: 'salon',
        description: 'A test beauty salon for testing business mode functionality',
        email: 'salon@testbusiness.com',
        phoneNumber: '+639123456789',
        address: {
            street: '123 Test Street',
            barangay: 'Test Barangay',
            city: 'Test City',
            province: 'Test Province',
            zipCode: '1234',
            coordinates: {
                lat: 14.5995,
                lng: 120.9842
            }
        },
        businessHours: [
            { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
            { day: 'Sunday', isOpen: false, openTime: '', closeTime: '' }
        ],
        verificationStatus: 'approved', // Pre-approved for testing
        verifiedAt: new Date(),
        isActive: true
    });

    console.log('✅ Test business created:', testBusiness.businessName);
    console.log('   Status:', testBusiness.verificationStatus);
    console.log('   Business ID:', testBusiness._id);

    return testBusiness;
}

// Run the script
createTestBusinessOwner();
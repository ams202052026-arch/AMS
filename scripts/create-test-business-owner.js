/**
 * Create Test Business Owner
 * Creates a test business owner with approved business for testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');
const Business = require('../models/business');

async function createTestBusinessOwner() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Check if test business owner already exists
        const existingUser = await User.findOne({ email: 'testbusiness@example.com' });
        if (existingUser) {
            console.log('✅ Test business owner already exists!');
            console.log('Email: testbusiness@example.com');
            console.log('Password: test123');
            
            const business = await Business.findOne({ ownerId: existingUser._id });
            if (business) {
                console.log(`Business: ${business.businessName}`);
                console.log(`Status: ${business.verificationStatus}`);
            }
            
            process.exit(0);
        }

        // Create test business owner
        const testUser = await User.create({
            firstName: 'Test',
            lastName: 'Business Owner',
            email: 'testbusiness@example.com',
            password: 'test123', // TODO: Hash with bcrypt in production
            phoneNumber: '09123456789',
            role: 'business_owner',
            isVerified: true,
            isActive: true
        });

        console.log('✓ Test business owner created:', testUser.email);

        // Create test business
        const testBusiness = await Business.create({
            ownerId: testUser._id,
            businessName: 'Test Coffee Shop',
            businessType: 'other',
            description: 'A cozy coffee shop for testing purposes',
            email: 'testbusiness@example.com',
            phoneNumber: '09123456789',
            website: 'https://testcoffeeshop.com',
            address: {
                street: '123 Test Street',
                barangay: 'Test Barangay',
                city: 'Test City',
                province: 'Test Province',
                zipCode: '1234'
            },
            verificationStatus: 'approved', // Pre-approved for testing
            isActive: true,
            verificationDocuments: [] // No documents needed for test
        });

        console.log('✓ Test business created:', testBusiness.businessName);

        // Link business to user
        testUser.businessId = testBusiness._id;
        await testUser.save();

        console.log('✓ Business linked to user\n');

        console.log('🎉 Test Business Owner Setup Complete!');
        console.log('='.repeat(50));
        console.log('LOGIN CREDENTIALS:');
        console.log('Email:    testbusiness@example.com');
        console.log('Password: test123');
        console.log('Business: Test Coffee Shop');
        console.log('Status:   Approved');
        console.log('='.repeat(50));
        console.log('\nLogin URL: http://localhost:3000/business-owner/login\n');

        process.exit(0);
    } catch (error) {
        console.error('Error creating test business owner:', error);
        process.exit(1);
    }
}

createTestBusinessOwner();
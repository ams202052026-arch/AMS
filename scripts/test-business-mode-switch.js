/**
 * Test Business Mode Switch Functionality
 * This script tests the Switch to Business Mode feature
 */

const mongoose = require('mongoose');
const User = require('../models/user');
const Business = require('../models/business');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AMS', {});

async function testBusinessModeSwitch() {
    try {
        console.log('🔄 Testing Business Mode Switch Functionality...');

        // Test different scenarios
        const testScenarios = [
            {
                name: 'Customer with no business application',
                email: 'customer-no-business@test.com',
                expectedStatus: 'not_applied',
                expectedAction: 'Apply for Business'
            },
            {
                name: 'Customer with pending business application',
                email: 'customer-pending@test.com',
                expectedStatus: 'pending',
                expectedAction: 'View Application'
            },
            {
                name: 'Customer with approved business application',
                email: 'customer-approved@test.com',
                expectedStatus: 'approved',
                expectedAction: 'Switch to Business Mode'
            },
            {
                name: 'Customer with rejected business application',
                email: 'customer-rejected@test.com',
                expectedStatus: 'rejected',
                expectedAction: 'Reapply'
            }
        ];

        // Clean up existing test data
        for (const scenario of testScenarios) {
            await User.deleteOne({ email: scenario.email });
            await Business.deleteOne({ businessName: `Test Business - ${scenario.name}` });
        }

        // Create test scenarios
        for (const scenario of testScenarios) {
            console.log(`\n📋 Creating scenario: ${scenario.name}`);
            
            // Create user
            const user = await User.create({
                firstName: 'Test',
                lastName: 'User',
                email: scenario.email,
                password: 'password123',
                phoneNumber: '09123456789',
                role: 'customer',
                isVerified: true
            });

            console.log(`✅ User created: ${user.email}`);

            // Create business application based on scenario
            if (scenario.expectedStatus !== 'not_applied') {
                let verificationStatus;
                switch (scenario.expectedStatus) {
                    case 'pending':
                        verificationStatus = 'pending';
                        break;
                    case 'approved':
                        verificationStatus = 'approved';
                        break;
                    case 'rejected':
                        verificationStatus = 'rejected';
                        break;
                }

                const business = await Business.create({
                    ownerId: user._id,
                    businessName: `Test Business - ${scenario.name}`,
                    businessType: 'salon',
                    description: 'Test business for mode switching',
                    email: user.email,
                    phoneNumber: '09123456789',
                    address: {
                        street: 'Test Street',
                        barangay: 'Test Barangay',
                        city: 'Test City',
                        province: 'Test Province',
                        coordinates: {
                            lat: 14.5995,
                            lng: 120.9842
                        }
                    },
                    verificationStatus: verificationStatus,
                    isActive: verificationStatus === 'approved'
                });

                // Link business to user
                user.businessId = business._id;
                await user.save();

                console.log(`✅ Business created with status: ${verificationStatus}`);
            }
        }

        console.log('\n🎯 Test Scenarios Created Successfully!');
        console.log('\n📋 How to Test:');
        console.log('1. Login with any of the test accounts:');
        
        for (const scenario of testScenarios) {
            console.log(`   - ${scenario.email} / password123`);
            console.log(`     Expected: ${scenario.expectedStatus} → ${scenario.expectedAction}`);
        }

        console.log('\n2. After login, click "Switch to Business" button in header');
        console.log('3. Verify the modal shows correct status and action button');
        console.log('4. Test the action button behavior');

        console.log('\n🔗 Test URLs:');
        console.log('   Login: http://localhost:3000/login');
        console.log('   Home: http://localhost:3000/home');
        console.log('   API Test: http://localhost:3000/api/mode-status');

        console.log('\n🧪 Expected Behaviors:');
        console.log('✅ not_applied → Shows "Apply for Business" → Redirects to /business/register');
        console.log('✅ pending → Shows "View Application" → Redirects to /business/status');
        console.log('✅ approved → Shows "Switch to Business Mode" → Redirects to /business-owner/dashboard');
        console.log('✅ rejected → Shows "Reapply" → Redirects to /business/reapply');

        console.log('\n🔍 Debug Tips:');
        console.log('- Check browser console for API errors');
        console.log('- Verify modal shows correct status');
        console.log('- Test button actions work correctly');
        console.log('- Check server logs for any errors');

    } catch (error) {
        console.error('❌ Test setup failed:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the test
testBusinessModeSwitch();
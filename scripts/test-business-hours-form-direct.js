/**
 * Direct Business Hours Form Test
 * Tests the exact form submission that happens in the browser
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Business = require('../models/business');

// Import the controller directly
const businessHoursController = require('../controllers/businessOwner/businessHours');

async function testBusinessHoursFormDirect() {
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

        // Find the business for this user
        const business = await Business.findOne({ ownerId: testUser._id });
        if (!business) {
            console.log('❌ Business not found for user');
            return;
        }

        console.log('✅ Business found:', business.businessName);
        console.log('Current business hours:', business.businessHours.length, 'entries');

        // Test the exact form data that would be sent from the browser
        console.log('\n🔄 Testing direct form submission...');

        // Simulate the exact request that the form makes
        const mockReq = {
            session: {
                userId: testUser._id.toString()
            },
            body: {
                businessHours: {
                    monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
                    tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
                    wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
                    thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
                    friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
                    saturday: { isOpen: true, openTime: '09:00', closeTime: '15:00' },
                    sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' }
                }
            }
        };

        console.log('Mock request body:', JSON.stringify(mockReq.body, null, 2));

        let responseData = null;
        let responseStatus = 200;

        const mockRes = {
            json: (data) => {
                responseData = data;
                console.log('Controller response:', JSON.stringify(data, null, 2));
                return data;
            },
            status: (code) => {
                responseStatus = code;
                return {
                    json: (data) => {
                        responseData = data;
                        console.log(`Controller error (${code}):`, JSON.stringify(data, null, 2));
                        return data;
                    }
                };
            }
        };

        // Call the controller function directly
        console.log('Calling updateBusinessHours controller...');
        await businessHoursController.updateBusinessHours(mockReq, mockRes);

        // Check the response
        if (responseData && responseData.success) {
            console.log('✅ Controller returned success');
        } else {
            console.log('❌ Controller returned error:', responseData);
        }

        // Verify the database was updated
        console.log('\n🔍 Verifying database update...');
        const updatedBusiness = await Business.findById(business._id);
        console.log('Updated business hours count:', updatedBusiness.businessHours.length);
        
        console.log('📅 Current Business Hours in DB:');
        updatedBusiness.businessHours.forEach(hour => {
            console.log(`${hour.day}: ${hour.isOpen ? `${hour.openTime} - ${hour.closeTime}` : 'Closed'}`);
        });

        // Test another scenario - Set Default Hours
        console.log('\n🔄 Testing Set Default Hours scenario...');
        
        const defaultHoursReq = {
            session: {
                userId: testUser._id.toString()
            },
            body: {
                businessHours: {
                    monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                    tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                    wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                    thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                    friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                    saturday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                    sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' }
                }
            }
        };

        console.log('Default hours request:', JSON.stringify(defaultHoursReq.body, null, 2));

        await businessHoursController.updateBusinessHours(defaultHoursReq, mockRes);

        // Verify default hours were saved
        const finalBusiness = await Business.findById(business._id);
        console.log('\n📅 Final Business Hours in DB:');
        finalBusiness.businessHours.forEach(hour => {
            console.log(`${hour.day}: ${hour.isOpen ? `${hour.openTime} - ${hour.closeTime}` : 'Closed'}`);
        });

        console.log('\n✅ Direct form test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

// Run the test
testBusinessHoursFormDirect();
/**
 * Test Time Slots with Business Hours
 * Tests if the time slots API is properly using business hours
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Business = require('../models/business');
const Service = require('../models/service');
const Staff = require('../models/staff');

async function testTimeSlotsWithBusinessHours() {
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
        console.log('Business hours count:', business.businessHours.length);

        // Display current business hours
        console.log('\n📅 Current Business Hours:');
        business.businessHours.forEach(hour => {
            console.log(`${hour.day}: ${hour.isOpen ? `${hour.openTime} - ${hour.closeTime}` : 'Closed'}`);
        });

        // Find a service from this business
        const service = await Service.findOne({ businessId: business._id, isActive: true });
        if (!service) {
            console.log('❌ No active service found for this business');
            return;
        }

        console.log('✅ Service found:', service.name);
        console.log('Service duration:', service.duration, 'minutes');

        // Find staff for this business
        const staff = await Staff.findOne({ businessId: business._id, isActive: true });
        if (!staff) {
            console.log('❌ No active staff found for this business');
            return;
        }

        console.log('✅ Staff found:', staff.name);

        // Test time slots for different days
        const testDates = [
            '2024-12-24', // Tuesday
            '2024-12-25', // Wednesday  
            '2024-12-28', // Saturday
            '2024-12-29'  // Sunday (should be closed)
        ];

        for (const testDate of testDates) {
            console.log(`\n🔍 Testing time slots for ${testDate}:`);
            
            const dayOfWeek = new Date(testDate).toLocaleDateString('en-US', { weekday: 'long' });
            console.log('Day of week:', dayOfWeek);

            // Get business hours for this day
            const businessHours = business.getHoursForDay(dayOfWeek);
            console.log('Business hours:', businessHours);

            // Simulate the time slots API call
            try {
                // Import the controller function
                const servicesController = require('../controllers/services');
                
                // Create mock request and response objects
                const mockReq = {
                    query: {
                        serviceId: service._id.toString(),
                        staffId: staff._id.toString(),
                        date: testDate
                    }
                };

                const mockRes = {
                    json: (data) => {
                        console.log('API Response:', JSON.stringify(data, null, 2));
                        return data;
                    },
                    status: (code) => ({
                        json: (data) => {
                            console.log(`API Error (${code}):`, JSON.stringify(data, null, 2));
                            return data;
                        }
                    })
                };

                // Call the controller function
                await servicesController.getAvailableSlots(mockReq, mockRes);

            } catch (error) {
                console.error('❌ Error testing time slots:', error.message);
            }
        }

        console.log('\n✅ Time slots test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

// Run the test
testTimeSlotsWithBusinessHours();
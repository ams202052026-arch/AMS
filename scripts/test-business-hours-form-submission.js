/**
 * Test Business Hours Form Submission
 * Simulates the actual form submission from the business hours page
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Business = require('../models/business');

async function testBusinessHoursFormSubmission() {
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

        // Test different business hours scenarios
        const testScenarios = [
            {
                name: 'Standard Business Hours (9-5 weekdays)',
                data: {
                    monday: { isOpen: 'true', openTime: '09:00', closeTime: '17:00' },
                    tuesday: { isOpen: 'true', openTime: '09:00', closeTime: '17:00' },
                    wednesday: { isOpen: 'true', openTime: '09:00', closeTime: '17:00' },
                    thursday: { isOpen: 'true', openTime: '09:00', closeTime: '17:00' },
                    friday: { isOpen: 'true', openTime: '09:00', closeTime: '17:00' },
                    saturday: { isOpen: 'false', openTime: '09:00', closeTime: '17:00' },
                    sunday: { isOpen: 'false', openTime: '09:00', closeTime: '17:00' }
                }
            },
            {
                name: 'Extended Hours with Weekend',
                data: {
                    monday: { isOpen: 'true', openTime: '08:00', closeTime: '20:00' },
                    tuesday: { isOpen: 'true', openTime: '08:00', closeTime: '20:00' },
                    wednesday: { isOpen: 'true', openTime: '08:00', closeTime: '20:00' },
                    thursday: { isOpen: 'true', openTime: '08:00', closeTime: '20:00' },
                    friday: { isOpen: 'true', openTime: '08:00', closeTime: '20:00' },
                    saturday: { isOpen: 'true', openTime: '10:00', closeTime: '18:00' },
                    sunday: { isOpen: 'true', openTime: '12:00', closeTime: '16:00' }
                }
            }
        ];

        for (const scenario of testScenarios) {
            console.log(`\n🧪 Testing: ${scenario.name}`);
            console.log('Input data:', JSON.stringify(scenario.data, null, 2));

            // Simulate the controller logic
            const businessHours = scenario.data;
            const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const updatedHours = [];

            daysOfWeek.forEach(day => {
                const dayData = businessHours[day.toLowerCase()];
                console.log(`Processing ${day}:`, dayData);
                if (dayData) {
                    updatedHours.push({
                        day: day,
                        isOpen: dayData.isOpen === 'true' || dayData.isOpen === true,
                        openTime: dayData.openTime || '09:00',
                        closeTime: dayData.closeTime || '18:00'
                    });
                }
            });

            console.log('Processed hours:', updatedHours);

            // Update business hours
            business.businessHours = updatedHours;
            await business.save();

            console.log('✅ Business hours updated successfully');

            // Verify the update
            const verifyBusiness = await Business.findById(business._id);
            console.log('📅 Saved Business Hours:');
            verifyBusiness.businessHours.forEach(hour => {
                console.log(`  ${hour.day}: ${hour.isOpen ? `${hour.openTime} - ${hour.closeTime}` : 'Closed'}`);
            });

            // Test business methods
            console.log('🔍 Business Status:');
            console.log('  Can accept bookings:', verifyBusiness.canAcceptBookings());
            console.log('  Is temporarily closed:', verifyBusiness.isTemporarilyClosed());

            // Test specific day methods
            console.log('🗓️ Day-specific checks:');
            ['Monday', 'Saturday', 'Sunday'].forEach(day => {
                const dayHours = verifyBusiness.getHoursForDay(day);
                console.log(`  ${day}: ${dayHours.isOpen ? `${dayHours.openTime}-${dayHours.closeTime}` : 'Closed'}`);
            });
        }

        console.log('\n✅ All business hours form submission tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

// Run the test
testBusinessHoursFormSubmission();
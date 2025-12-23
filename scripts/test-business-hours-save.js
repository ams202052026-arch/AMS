/**
 * Test Business Hours Save Functionality
 * Tests if business hours are being saved correctly
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Business = require('../models/business');

async function testBusinessHoursSave() {
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

        // Test the business hours update functionality
        console.log('\n🔄 Testing business hours update...');
        
        // Simulate the data that would come from the form
        const testBusinessHours = {
            monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
            tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
            wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
            thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
            friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
            saturday: { isOpen: true, openTime: '09:00', closeTime: '15:00' },
            sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' }
        };

        console.log('Test data:', JSON.stringify(testBusinessHours, null, 2));

        // Process the data like the controller does
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const updatedHours = [];

        daysOfWeek.forEach(day => {
            const dayData = testBusinessHours[day.toLowerCase()];
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

        // Save to database
        business.businessHours = updatedHours;
        await business.save();

        console.log('✅ Business hours saved successfully');

        // Verify the save
        const verifyBusiness = await Business.findById(business._id);
        console.log('\n📅 Verified Business Hours:');
        verifyBusiness.businessHours.forEach(hour => {
            console.log(`${hour.day}: ${hour.isOpen ? `${hour.openTime} - ${hour.closeTime}` : 'Closed'}`);
        });

        // Test the business methods
        console.log('\n🧪 Testing business methods:');
        console.log('Can accept bookings:', verifyBusiness.canAcceptBookings());
        console.log('Is temporarily closed:', verifyBusiness.isTemporarilyClosed());
        
        // Test getting hours for specific days
        console.log('\nHours for Monday:', verifyBusiness.getHoursForDay('Monday'));
        console.log('Hours for Sunday:', verifyBusiness.getHoursForDay('Sunday'));

        console.log('\n✅ Business hours save test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

// Run the test
testBusinessHoursSave();
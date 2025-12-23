const mongoose = require('mongoose');
const Business = require('../models/business');
const User = require('../models/user');

async function manualBusinessHoursTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        console.log('\n=== MANUAL BUSINESS HOURS TEST ===');

        // Find test business
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        const business = await Business.findOne({ ownerId: testUser._id });
        
        if (!business) {
            console.log('Test business not found');
            return;
        }

        console.log(`Business: ${business.businessName}`);

        // Test 1: Clear all business hours and see what happens
        console.log('\n--- Test 1: Clear business hours ---');
        business.businessHours = [];
        await business.save();
        console.log('✅ Business hours cleared');

        // Reload and check
        const clearedBusiness = await Business.findById(business._id);
        console.log('Business hours after clear:', clearedBusiness.businessHours.length);

        // Test 2: Set specific business hours
        console.log('\n--- Test 2: Set specific business hours ---');
        const newHours = [
            { day: 'Monday', isOpen: true, openTime: '08:00', closeTime: '17:00' },
            { day: 'Tuesday', isOpen: true, openTime: '08:00', closeTime: '17:00' },
            { day: 'Wednesday', isOpen: true, openTime: '08:00', closeTime: '17:00' },
            { day: 'Thursday', isOpen: true, openTime: '08:00', closeTime: '17:00' },
            { day: 'Friday', isOpen: true, openTime: '08:00', closeTime: '17:00' },
            { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '15:00' },
            { day: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '18:00' }
        ];

        clearedBusiness.businessHours = newHours;
        await clearedBusiness.save();
        console.log('✅ New business hours set');

        // Test 3: Verify persistence
        console.log('\n--- Test 3: Verify persistence ---');
        const verifyBusiness = await Business.findById(business._id);
        console.log('Business hours after save:', verifyBusiness.businessHours.length);
        
        verifyBusiness.businessHours.forEach((dayHour, index) => {
            console.log(`${index + 1}. ${dayHour.day}: ${dayHour.isOpen ? `${dayHour.openTime} - ${dayHour.closeTime}` : 'Closed'}`);
        });

        // Test 4: Test the load controller logic
        console.log('\n--- Test 4: Test load controller logic ---');
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const businessHours = [];

        daysOfWeek.forEach(day => {
            const existingHour = verifyBusiness.businessHours.find(bh => bh.day === day);
            if (existingHour) {
                businessHours.push(existingHour);
            } else {
                // Default hours: 9 AM to 6 PM, open Monday-Saturday, closed Sunday
                businessHours.push({
                    day: day,
                    isOpen: day !== 'Sunday',
                    openTime: '09:00',
                    closeTime: '18:00'
                });
            }
        });

        console.log('Controller would return:');
        businessHours.forEach((dayHour, index) => {
            console.log(`${index + 1}. ${dayHour.day}: ${dayHour.isOpen ? `${dayHour.openTime} - ${dayHour.closeTime}` : 'Closed'}`);
        });

        // Test 5: Test business availability methods
        console.log('\n--- Test 5: Test business availability methods ---');
        
        const testDate = new Date('2025-12-24'); // Tuesday
        const testTime = '10:00';
        
        console.log(`Testing: ${testDate.toLocaleDateString('en-US', { weekday: 'long' })} at ${testTime}`);
        console.log(`Can accept bookings: ${verifyBusiness.canAcceptBookings()}`);
        console.log(`Is open at test time: ${verifyBusiness.isOpenAt(testDate, testTime)}`);
        
        const dayHours = verifyBusiness.getHoursForDay('Tuesday');
        console.log(`Tuesday hours: ${dayHours ? (dayHours.isOpen ? `${dayHours.openTime} - ${dayHours.closeTime}` : 'Closed') : 'Not set'}`);

        console.log('\n=== MANUAL TEST COMPLETE ===');
        
    } catch (error) {
        console.error('Error in manual test:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

manualBusinessHoursTest();
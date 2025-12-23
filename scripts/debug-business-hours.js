const mongoose = require('mongoose');
const Business = require('../models/business');
const User = require('../models/user');

async function debugBusinessHours() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        console.log('\n=== DEBUGGING BUSINESS HOURS ISSUES ===');

        // Find test business
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        const business = await Business.findOne({ ownerId: testUser._id });
        
        if (!business) {
            console.log('Test business not found');
            return;
        }

        console.log(`Business: ${business.businessName}`);
        console.log(`Business ID: ${business._id}`);

        // Check current business hours
        console.log('\n--- Current Business Hours in Database ---');
        console.log(`Business hours array length: ${business.businessHours.length}`);
        
        if (business.businessHours.length === 0) {
            console.log('❌ NO BUSINESS HOURS SET - This explains why settings don\'t persist');
        } else {
            business.businessHours.forEach((dayHour, index) => {
                console.log(`${index + 1}. ${dayHour.day}: ${dayHour.isOpen ? `${dayHour.openTime} - ${dayHour.closeTime}` : 'Closed'}`);
            });
        }

        // Test 1: Simulate setting business hours (like the form submission)
        console.log('\n--- Testing Business Hours Update ---');
        
        const testBusinessHours = {
            monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
            saturday: { isOpen: true, openTime: '10:00', closeTime: '16:00' },
            sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' }
        };

        // Simulate the controller logic
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const updatedHours = [];

        daysOfWeek.forEach(day => {
            const dayData = testBusinessHours[day.toLowerCase()];
            if (dayData) {
                updatedHours.push({
                    day: day,
                    isOpen: dayData.isOpen === 'true' || dayData.isOpen === true,
                    openTime: dayData.openTime || '09:00',
                    closeTime: dayData.closeTime || '18:00'
                });
            }
        });

        console.log('Updating business hours...');
        business.businessHours = updatedHours;
        await business.save();
        console.log('✅ Business hours updated');

        // Verify the update
        const updatedBusiness = await Business.findById(business._id);
        console.log('\n--- Verification After Update ---');
        console.log(`Business hours array length: ${updatedBusiness.businessHours.length}`);
        
        updatedBusiness.businessHours.forEach((dayHour, index) => {
            console.log(`${index + 1}. ${dayHour.day}: ${dayHour.isOpen ? `${dayHour.openTime} - ${dayHour.closeTime}` : 'Closed'}`);
        });

        // Test 2: Test business availability methods
        console.log('\n--- Testing Business Availability Methods ---');
        
        const testDate = new Date('2025-12-24'); // Tuesday
        const testTime = '10:00';
        
        console.log(`Testing: ${testDate.toLocaleDateString('en-US', { weekday: 'long' })} at ${testTime}`);
        console.log(`Can accept bookings: ${updatedBusiness.canAcceptBookings()}`);
        console.log(`Is open at test time: ${updatedBusiness.isOpenAt(testDate, testTime)}`);
        
        const dayHours = updatedBusiness.getHoursForDay('Tuesday');
        console.log(`Tuesday hours: ${dayHours ? (dayHours.isOpen ? `${dayHours.openTime} - ${dayHours.closeTime}` : 'Closed') : 'Not set'}`);

        // Test 3: Check what the controller would return
        console.log('\n--- Testing Controller Logic ---');
        
        // Simulate loadBusinessHours controller
        const businessHours = [];
        daysOfWeek.forEach(day => {
            const existingHour = updatedBusiness.businessHours.find(bh => bh.day === day);
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

        console.log('\n=== DEBUG COMPLETE ===');
        
    } catch (error) {
        console.error('Error debugging business hours:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

debugBusinessHours();
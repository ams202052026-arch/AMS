const mongoose = require('mongoose');
const Business = require('../models/business');
const User = require('../models/user');

async function testBusinessHours() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        console.log('\n=== TESTING BUSINESS HOURS FUNCTIONALITY ===');

        // Find test business
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        const business = await Business.findOne({ ownerId: testUser._id });
        
        if (!business) {
            console.log('Test business not found');
            return;
        }

        console.log(`Business: ${business.businessName}`);
        console.log(`Current status: ${business.isCurrentlyOpen ? 'Open' : 'Closed'}`);

        // Test 1: Set up default business hours
        console.log('\n--- Setting Up Default Business Hours ---');
        const defaultHours = [
            { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Saturday', isOpen: true, openTime: '10:00', closeTime: '16:00' },
            { day: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '18:00' }
        ];

        business.businessHours = defaultHours;
        await business.save();
        console.log('✅ Default business hours set');

        // Test 2: Check business availability methods
        console.log('\n--- Testing Business Availability Methods ---');
        
        // Test canAcceptBookings
        console.log(`Can accept bookings: ${business.canAcceptBookings()}`);
        
        // Test isOpenAt for different days and times
        const testCases = [
            { day: 'Monday', time: '10:00', expected: true },
            { day: 'Monday', time: '08:00', expected: false },
            { day: 'Monday', time: '19:00', expected: false },
            { day: 'Saturday', time: '12:00', expected: true },
            { day: 'Saturday', time: '17:00', expected: false },
            { day: 'Sunday', time: '12:00', expected: false }
        ];

        testCases.forEach(testCase => {
            const testDate = new Date();
            // Set to next occurrence of the day
            const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(testCase.day);
            testDate.setDate(testDate.getDate() + (dayIndex - testDate.getDay() + 7) % 7);
            
            const isOpen = business.isOpenAt(testDate, testCase.time);
            const status = isOpen === testCase.expected ? '✅' : '❌';
            console.log(`${status} ${testCase.day} ${testCase.time}: ${isOpen} (expected: ${testCase.expected})`);
        });

        // Test 3: Test temporary closure
        console.log('\n--- Testing Temporary Closure ---');
        
        // Close business temporarily
        business.isCurrentlyOpen = false;
        business.temporaryClosureReason = 'Emergency maintenance';
        business.temporaryClosureUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
        await business.save();
        
        console.log('✅ Business temporarily closed');
        console.log(`Reason: ${business.temporaryClosureReason}`);
        console.log(`Until: ${business.temporaryClosureUntil}`);
        console.log(`Is temporarily closed: ${business.isTemporarilyClosed()}`);
        console.log(`Can accept bookings: ${business.canAcceptBookings()}`);

        // Test 4: Reopen business
        console.log('\n--- Reopening Business ---');
        business.isCurrentlyOpen = true;
        business.temporaryClosureReason = null;
        business.temporaryClosureUntil = null;
        await business.save();
        
        console.log('✅ Business reopened');
        console.log(`Can accept bookings: ${business.canAcceptBookings()}`);

        // Test 5: Get hours for specific days
        console.log('\n--- Testing Day-Specific Hours ---');
        ['Monday', 'Saturday', 'Sunday'].forEach(day => {
            const hours = business.getHoursForDay(day);
            if (hours) {
                console.log(`${day}: ${hours.isOpen ? `${hours.openTime} - ${hours.closeTime}` : 'Closed'}`);
            } else {
                console.log(`${day}: No hours set`);
            }
        });

        console.log('\n=== BUSINESS HOURS TEST COMPLETE ===');
        
    } catch (error) {
        console.error('Error testing business hours:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

testBusinessHours();
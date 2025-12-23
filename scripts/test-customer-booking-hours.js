const mongoose = require('mongoose');
const Business = require('../models/business');
const Service = require('../models/service');
const User = require('../models/user');

async function testCustomerBookingHours() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        console.log('\n=== TESTING CUSTOMER BOOKING HOURS VALIDATION ===');

        // Find test business and service
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        const business = await Business.findOne({ ownerId: testUser._id });
        const service = await Service.findOne({ businessId: business._id });
        
        if (!business || !service) {
            console.log('Test business or service not found');
            return;
        }

        console.log(`Business: ${business.businessName}`);
        console.log(`Service: ${service.name}`);

        // Check current business hours
        console.log('\n--- Current Business Hours ---');
        business.businessHours.forEach((dayHour, index) => {
            console.log(`${index + 1}. ${dayHour.day}: ${dayHour.isOpen ? `${dayHour.openTime} - ${dayHour.closeTime}` : 'Closed'}`);
        });

        // Test 1: Check business availability for different days
        console.log('\n--- Test 1: Business Availability by Day ---');
        const testDates = [
            '2025-12-22', // Sunday
            '2025-12-23', // Monday  
            '2025-12-24', // Tuesday
            '2025-12-25', // Wednesday (Christmas)
            '2025-12-26', // Thursday
            '2025-12-27', // Friday
            '2025-12-28'  // Saturday
        ];

        for (const dateStr of testDates) {
            const testDate = new Date(dateStr);
            const dayName = testDate.toLocaleDateString('en-US', { weekday: 'long' });
            const dayHours = business.getHoursForDay(dayName);
            
            console.log(`${dateStr} (${dayName}): ${dayHours ? (dayHours.isOpen ? `Open ${dayHours.openTime}-${dayHours.closeTime}` : 'Closed') : 'No hours set'}`);
        }

        // Test 2: Check specific time validations
        console.log('\n--- Test 2: Time Validation Tests ---');
        const testDate = new Date('2025-12-24'); // Tuesday
        const dayName = testDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dayHours = business.getHoursForDay(dayName);
        
        if (dayHours && dayHours.isOpen) {
            const testTimes = [
                '07:00', // Before opening
                '08:00', // At opening
                '12:00', // During hours
                '17:00', // At closing
                '18:00'  // After closing
            ];
            
            console.log(`Testing times for ${dayName} (${dayHours.openTime} - ${dayHours.closeTime}):`);
            
            testTimes.forEach(time => {
                const isOpen = business.isOpenAt(testDate, time);
                console.log(`  ${time}: ${isOpen ? '✅ Open' : '❌ Closed'}`);
            });
        }

        // Test 3: Test the booking validation logic
        console.log('\n--- Test 3: Booking Validation Logic ---');
        
        const timeToMinutes = (timeStr) => {
            const [hours, mins] = timeStr.split(':').map(Number);
            return hours * 60 + mins;
        };
        
        const bookingDate = new Date('2025-12-24'); // Tuesday
        const bookingDayName = bookingDate.toLocaleDateString('en-US', { weekday: 'long' });
        const bookingDayHours = business.getHoursForDay(bookingDayName);
        
        if (bookingDayHours && bookingDayHours.isOpen) {
            const testBookings = [
                { start: '07:30', end: '08:30' }, // Starts before opening
                { start: '08:00', end: '09:00' }, // Valid booking
                { start: '16:30', end: '17:30' }, // Ends after closing
                { start: '12:00', end: '13:00' }  // Valid booking
            ];
            
            console.log(`Testing bookings for ${bookingDayName} (Business hours: ${bookingDayHours.openTime} - ${bookingDayHours.closeTime}):`);
            
            testBookings.forEach(booking => {
                const bookingStartMinutes = timeToMinutes(booking.start);
                const bookingEndMinutes = timeToMinutes(booking.end);
                const businessOpenMinutes = timeToMinutes(bookingDayHours.openTime);
                const businessCloseMinutes = timeToMinutes(bookingDayHours.closeTime);
                
                const isValid = bookingStartMinutes >= businessOpenMinutes && bookingEndMinutes <= businessCloseMinutes;
                
                console.log(`  ${booking.start} - ${booking.end}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
                
                if (!isValid) {
                    if (bookingStartMinutes < businessOpenMinutes) {
                        console.log(`    Reason: Starts before business opens (${bookingDayHours.openTime})`);
                    }
                    if (bookingEndMinutes > businessCloseMinutes) {
                        console.log(`    Reason: Ends after business closes (${bookingDayHours.closeTime})`);
                    }
                }
            });
        }

        console.log('\n=== CUSTOMER BOOKING HOURS TEST COMPLETE ===');
        
    } catch (error) {
        console.error('Error testing customer booking hours:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

testCustomerBookingHours();
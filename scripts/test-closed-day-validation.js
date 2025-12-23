const mongoose = require('mongoose');
const Business = require('../models/business');
const Service = require('../models/service');
require('dotenv').config();

async function testClosedDayValidation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');
        console.log('✅ Connected to MongoDB\n');
        
        // Find a business with hours set
        const business = await Business.findOne({ businessName: 'LUMPIANG TANGA' });
        
        if (!business) {
            console.log('❌ Business not found');
            process.exit(1);
        }
        
        console.log('=== BUSINESS HOURS ===');
        console.log('Business:', business.businessName);
        business.businessHours.forEach(bh => {
            console.log(`  ${bh.day}: ${bh.isOpen ? `Open ${bh.openTime}-${bh.closeTime}` : 'Closed'}`);
        });
        
        // Test different days
        console.log('\n=== TESTING AVAILABILITY ===');
        
        const testDates = [
            { date: '2024-12-23', day: 'Monday' },    // Should be open
            { date: '2024-12-24', day: 'Tuesday' },   // Should be open
            { date: '2024-12-29', day: 'Sunday' }     // Should be closed
        ];
        
        for (const test of testDates) {
            const bookingDate = new Date(test.date);
            const dayName = bookingDate.toLocaleDateString('en-US', { weekday: 'long' });
            
            console.log(`\nTesting ${test.date} (${dayName}):`);
            
            // Check if business can accept bookings
            if (!business.canAcceptBookings()) {
                console.log('  ❌ Business not accepting bookings');
                continue;
            }
            
            // Check if temporarily closed
            if (business.isTemporarilyClosed()) {
                console.log('  ❌ Temporarily closed:', business.temporaryClosureReason);
                continue;
            }
            
            // Get business hours for the day
            const dayHours = business.getHoursForDay(dayName);
            
            if (!dayHours || !dayHours.isOpen) {
                console.log(`  ❌ Closed on ${dayName}s`);
                console.log(`  → Message: "Business is closed on ${dayName}s"`);
            } else {
                console.log(`  ✅ Open: ${dayHours.openTime} - ${dayHours.closeTime}`);
            }
        }
        
        console.log('\n=== API SIMULATION ===');
        console.log('When customer selects Sunday (closed):');
        console.log('  1. Date input changes');
        console.log('  2. JavaScript calls: /api/services/business-availability?businessId=...&date=2024-12-29');
        console.log('  3. API returns: { available: false, reason: "Business is closed on Sundays" }');
        console.log('  4. Message appears below date input: "⚠️ Business is closed on Sundays"');
        console.log('  5. Time slots show: "Business is closed on this day"');
        
        console.log('\n✅ Test complete! Now test in browser:');
        console.log('  1. Go to booking page for any service');
        console.log('  2. Select a Sunday date');
        console.log('  3. Should see warning message below date input');
        console.log('  4. Time slots should show closed message');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testClosedDayValidation();

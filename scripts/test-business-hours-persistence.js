const mongoose = require('mongoose');
const Business = require('../models/business');
require('dotenv').config();

async function testPersistence() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');
        console.log('✅ Connected to MongoDB\n');
        
        // Find the business
        const business = await Business.findOne().sort({createdAt: -1});
        
        if (!business) {
            console.log('❌ No business found');
            process.exit(1);
        }
        
        console.log('=== STEP 1: Current State ===');
        console.log('Business:', business.businessName);
        console.log('Current hours count:', business.businessHours.length);
        business.businessHours.forEach(bh => {
            console.log(`  ${bh.day}: ${bh.isOpen ? `Open ${bh.openTime}-${bh.closeTime}` : 'Closed'}`);
        });
        
        // Simulate what the controller does when loading the page
        console.log('\n=== STEP 2: Simulating Controller Load ===');
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const businessHours = [];
        
        daysOfWeek.forEach(day => {
            const existingHour = business.businessHours.find(bh => bh.day === day);
            if (existingHour) {
                const hourData = {
                    day: existingHour.day,
                    isOpen: existingHour.isOpen,
                    openTime: existingHour.openTime || '09:00',
                    closeTime: existingHour.closeTime || '18:00',
                    _id: existingHour._id
                };
                console.log(`${day}: Loaded from DB - ${hourData.isOpen ? `${hourData.openTime}-${hourData.closeTime}` : 'Closed'}`);
                businessHours.push(hourData);
            } else {
                const defaultHour = {
                    day: day,
                    isOpen: day !== 'Sunday',
                    openTime: '09:00',
                    closeTime: '18:00'
                };
                console.log(`${day}: Using default - ${defaultHour.isOpen ? `${defaultHour.openTime}-${defaultHour.closeTime}` : 'Closed'}`);
                businessHours.push(defaultHour);
            }
        });
        
        console.log('\n=== STEP 3: Data Passed to View ===');
        console.log('businessHours array length:', businessHours.length);
        console.log(JSON.stringify(businessHours, null, 2));
        
        console.log('\n=== STEP 4: Verification ===');
        const allDaysPresent = daysOfWeek.every(day => 
            businessHours.some(bh => bh.day === day)
        );
        console.log('All days present:', allDaysPresent ? '✅' : '❌');
        
        const allHaveValidTimes = businessHours.every(bh => 
            bh.openTime && bh.closeTime && bh.openTime !== '' && bh.closeTime !== ''
        );
        console.log('All have valid times:', allHaveValidTimes ? '✅' : '❌');
        
        console.log('\n✅ Test complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testPersistence();

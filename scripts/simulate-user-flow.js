const mongoose = require('mongoose');
const Business = require('../models/business');
require('dotenv').config();

async function simulateUserFlow() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');
        console.log('✅ Connected to MongoDB\n');
        
        const business = await Business.findOne().sort({createdAt: -1});
        
        if (!business) {
            console.log('❌ No business found');
            process.exit(1);
        }
        
        console.log('=== SIMULATING USER FLOW ===\n');
        
        // STEP 1: User navigates to Business Hours page
        console.log('📍 STEP 1: User opens Business Hours page');
        console.log('   Loading business hours from database...');
        
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const businessHours = [];
        
        daysOfWeek.forEach(day => {
            const existingHour = business.businessHours.find(bh => bh.day === day);
            if (existingHour) {
                const hourData = {
                    day: existingHour.day,
                    isOpen: existingHour.isOpen,
                    openTime: existingHour.openTime || '09:00',
                    closeTime: existingHour.closeTime || '18:00'
                };
                businessHours.push(hourData);
            }
        });
        
        console.log('   ✅ Page loaded with saved hours:');
        businessHours.forEach(bh => {
            console.log(`      ${bh.day}: ${bh.isOpen ? `Open ${bh.openTime}-${bh.closeTime}` : 'Closed'}`);
        });
        
        // STEP 2: User changes Saturday hours
        console.log('\n📍 STEP 2: User changes Saturday hours to 10:00-16:00');
        const saturdayIndex = businessHours.findIndex(bh => bh.day === 'Saturday');
        businessHours[saturdayIndex].openTime = '10:00';
        businessHours[saturdayIndex].closeTime = '16:00';
        console.log('   ✅ Form updated (not saved yet)');
        
        // STEP 3: User clicks Save
        console.log('\n📍 STEP 3: User clicks "Save Business Hours"');
        const updatedHours = [];
        daysOfWeek.forEach(day => {
            const dayData = businessHours.find(bh => bh.day === day);
            if (dayData) {
                const isOpen = dayData.isOpen;
                updatedHours.push({
                    day: day,
                    isOpen: isOpen,
                    openTime: isOpen ? (dayData.openTime || '09:00') : '09:00',
                    closeTime: isOpen ? (dayData.closeTime || '18:00') : '18:00'
                });
            }
        });
        
        business.businessHours = updatedHours;
        await business.save();
        console.log('   ✅ Saved to database');
        
        // STEP 4: User navigates away
        console.log('\n📍 STEP 4: User navigates to Dashboard');
        console.log('   (Business Hours page unloaded)');
        
        // STEP 5: User comes back
        console.log('\n📍 STEP 5: User returns to Business Hours page');
        console.log('   Loading business hours from database...');
        
        // Reload from database
        const reloadedBusiness = await Business.findById(business._id);
        const reloadedHours = [];
        
        daysOfWeek.forEach(day => {
            const existingHour = reloadedBusiness.businessHours.find(bh => bh.day === day);
            if (existingHour) {
                const hourData = {
                    day: existingHour.day,
                    isOpen: existingHour.isOpen,
                    openTime: existingHour.openTime || '09:00',
                    closeTime: existingHour.closeTime || '18:00'
                };
                reloadedHours.push(hourData);
            }
        });
        
        console.log('   ✅ Page loaded with saved hours:');
        reloadedHours.forEach(bh => {
            console.log(`      ${bh.day}: ${bh.isOpen ? `Open ${bh.openTime}-${bh.closeTime}` : 'Closed'}`);
        });
        
        // VERIFICATION
        console.log('\n=== VERIFICATION ===');
        const saturdayReloaded = reloadedHours.find(bh => bh.day === 'Saturday');
        if (saturdayReloaded.openTime === '10:00' && saturdayReloaded.closeTime === '16:00') {
            console.log('✅ SUCCESS: Saturday hours persisted correctly!');
            console.log(`   Expected: 10:00-16:00`);
            console.log(`   Got: ${saturdayReloaded.openTime}-${saturdayReloaded.closeTime}`);
        } else {
            console.log('❌ FAILED: Saturday hours did not persist');
            console.log(`   Expected: 10:00-16:00`);
            console.log(`   Got: ${saturdayReloaded.openTime}-${saturdayReloaded.closeTime}`);
        }
        
        console.log('\n✅ User flow simulation complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

simulateUserFlow();

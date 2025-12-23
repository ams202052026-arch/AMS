const mongoose = require('mongoose');
const Business = require('../models/business');
const User = require('../models/user');
require('dotenv').config();

async function testSave() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');
        console.log('✅ Connected to MongoDB\n');
        
        const user = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        const business = await Business.findOne({ ownerId: user._id });
        
        console.log('=== BEFORE SAVE ===');
        business.businessHours.forEach(bh => {
            console.log(`${bh.day}: isOpen=${bh.isOpen} (type: ${typeof bh.isOpen})`);
        });
        
        // Simulate what the form sends
        const formData = {
            businessHours: {
                monday: { isOpen: 'on', openTime: '09:00', closeTime: '18:00' },
                tuesday: { isOpen: 'on', openTime: '09:00', closeTime: '18:00' },
                wednesday: { isOpen: 'on', openTime: '09:00', closeTime: '18:00' },
                thursday: { isOpen: 'on', openTime: '09:00', closeTime: '18:00' },
                friday: { isOpen: 'on', openTime: '09:00', closeTime: '18:00' },
                saturday: { isOpen: 'on', openTime: '09:00', closeTime: '18:00' },
                sunday: { openTime: '09:00', closeTime: '18:00' } // No isOpen means unchecked
            }
        };
        
        console.log('\n=== SIMULATING CONTROLLER SAVE LOGIC ===');
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const updatedHours = [];
        
        daysOfWeek.forEach(day => {
            const dayData = formData.businessHours[day.toLowerCase()];
            console.log(`\nProcessing ${day}:`);
            console.log('  dayData:', dayData);
            
            if (dayData) {
                const isOpen = dayData.isOpen === 'true' || dayData.isOpen === true;
                console.log(`  dayData.isOpen: "${dayData.isOpen}" (type: ${typeof dayData.isOpen})`);
                console.log(`  Checking: dayData.isOpen === 'true': ${dayData.isOpen === 'true'}`);
                console.log(`  Checking: dayData.isOpen === true: ${dayData.isOpen === true}`);
                console.log(`  Result isOpen: ${isOpen}`);
                
                updatedHours.push({
                    day: day,
                    isOpen: isOpen,
                    openTime: isOpen ? (dayData.openTime || '09:00') : '09:00',
                    closeTime: isOpen ? (dayData.closeTime || '18:00') : '18:00'
                });
            }
        });
        
        console.log('\n=== WHAT WOULD BE SAVED ===');
        updatedHours.forEach(bh => {
            console.log(`${bh.day}: isOpen=${bh.isOpen}, ${bh.openTime}-${bh.closeTime}`);
        });
        
        console.log('\n❌ PROBLEM FOUND!');
        console.log('Checkboxes send "on" not "true"!');
        console.log('The controller checks for === "true" or === true');
        console.log('So "on" becomes false!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testSave();

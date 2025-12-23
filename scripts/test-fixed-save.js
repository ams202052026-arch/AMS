const mongoose = require('mongoose');
const Business = require('../models/business');
const User = require('../models/user');
require('dotenv').config();

async function testFixedSave() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');
        console.log('✅ Connected to MongoDB\n');
        
        const user = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        const business = await Business.findOne({ ownerId: user._id });
        
        console.log('=== TESTING FIXED SAVE LOGIC ===\n');
        
        // Simulate what the FIXED form sends (boolean values)
        const formData = {
            businessHours: {
                monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                saturday: { isOpen: true, openTime: '10:00', closeTime: '16:00' },
                sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' }
            }
        };
        
        console.log('Form data (with boolean isOpen):');
        Object.entries(formData.businessHours).forEach(([day, data]) => {
            console.log(`  ${day}: isOpen=${data.isOpen} (type: ${typeof data.isOpen})`);
        });
        
        console.log('\n=== SIMULATING FIXED CONTROLLER LOGIC ===');
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const updatedHours = [];
        
        daysOfWeek.forEach(day => {
            const dayData = formData.businessHours[day.toLowerCase()];
            
            if (dayData) {
                // Handle boolean, string "true"/"false", or "on" from checkboxes
                let isOpen = false;
                if (typeof dayData.isOpen === 'boolean') {
                    isOpen = dayData.isOpen;
                } else if (typeof dayData.isOpen === 'string') {
                    isOpen = dayData.isOpen === 'true' || dayData.isOpen === 'on';
                }
                
                console.log(`${day}: isOpen=${dayData.isOpen} (${typeof dayData.isOpen}) -> ${isOpen}`);
                
                updatedHours.push({
                    day: day,
                    isOpen: isOpen,
                    openTime: isOpen ? (dayData.openTime || '09:00') : '09:00',
                    closeTime: isOpen ? (dayData.closeTime || '18:00') : '18:00'
                });
            }
        });
        
        console.log('\n=== WHAT WILL BE SAVED ===');
        updatedHours.forEach(bh => {
            console.log(`${bh.day}: isOpen=${bh.isOpen}, ${bh.openTime}-${bh.closeTime}`);
        });
        
        // Actually save it
        console.log('\n=== SAVING TO DATABASE ===');
        business.businessHours = updatedHours;
        await business.save();
        
        // Reload and verify
        const reloaded = await Business.findById(business._id);
        console.log('\n=== VERIFIED IN DATABASE ===');
        reloaded.businessHours.forEach(bh => {
            console.log(`${bh.day}: isOpen=${bh.isOpen}, ${bh.openTime}-${bh.closeTime}`);
        });
        
        console.log('\n✅ Fixed! Now refresh your browser and try saving.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testFixedSave();

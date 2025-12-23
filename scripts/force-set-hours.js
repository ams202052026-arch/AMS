const mongoose = require('mongoose');
const Business = require('../models/business');
require('dotenv').config();

async function forceSetHours() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');
        console.log('✅ Connected to MongoDB\n');
        
        const business = await Business.findOne({ businessName: 'LUMPIANG TANGA' });
        
        if (!business) {
            console.log('❌ Business not found');
            process.exit(1);
        }
        
        console.log('Found business:', business.businessName);
        console.log('Current hours:', business.businessHours.length);
        
        // Clear and set new hours
        business.businessHours = [];
        
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        days.forEach(day => {
            business.businessHours.push({
                day: day,
                isOpen: day !== 'Sunday',
                openTime: '09:00',
                closeTime: '18:00'
            });
        });
        
        console.log('\nSaving...');
        await business.save();
        
        // Reload to verify
        const reloaded = await Business.findById(business._id);
        console.log('\n=== VERIFIED SAVED HOURS ===');
        reloaded.businessHours.forEach(bh => {
            console.log(`${bh.day}: isOpen=${bh.isOpen}, ${bh.openTime}-${bh.closeTime}`);
        });
        
        console.log('\n✅ Done! Refresh your browser.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

forceSetHours();

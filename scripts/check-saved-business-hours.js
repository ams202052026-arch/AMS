const mongoose = require('mongoose');
const Business = require('../models/business');
require('dotenv').config();

async function checkBusinessHours() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');
        console.log('✅ Connected to MongoDB');
        
        const business = await Business.findOne().sort({createdAt: -1});
        
        if (!business) {
            console.log('❌ No business found');
            process.exit(1);
        }
        
        console.log('\n=== BUSINESS HOURS IN DATABASE ===');
        console.log('Business Name:', business.businessName);
        console.log('Business Hours Count:', business.businessHours.length);
        console.log('\nBusiness Hours Data:');
        
        if (business.businessHours.length === 0) {
            console.log('  ⚠️  No business hours saved!');
        } else {
            business.businessHours.forEach(bh => {
                console.log(`  ${bh.day}: ${bh.isOpen ? `Open ${bh.openTime}-${bh.closeTime}` : 'Closed'}`);
            });
        }
        
        console.log('\n=== RAW DATA ===');
        console.log(JSON.stringify(business.businessHours, null, 2));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkBusinessHours();

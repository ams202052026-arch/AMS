const mongoose = require('mongoose');
const Business = require('../models/business');
require('dotenv').config();

async function listBusinesses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');
        console.log('✅ Connected to MongoDB\n');
        
        const businesses = await Business.find();
        
        console.log(`=== FOUND ${businesses.length} BUSINESSES ===\n`);
        
        businesses.forEach((business, index) => {
            console.log(`${index + 1}. ${business.businessName}`);
            console.log(`   ID: ${business._id}`);
            console.log(`   Owner ID: ${business.ownerId}`);
            console.log(`   Status: ${business.verificationStatus}`);
            console.log(`   Business Hours: ${business.businessHours.length} days`);
            business.businessHours.forEach(bh => {
                console.log(`     ${bh.day}: ${bh.isOpen ? `Open ${bh.openTime}-${bh.closeTime}` : 'Closed'}`);
            });
            console.log('');
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

listBusinesses();

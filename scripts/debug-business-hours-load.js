const mongoose = require('mongoose');
const Business = require('../models/business');
const User = require('../models/user');
require('dotenv').config();

async function debugLoad() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');
        console.log('✅ Connected to MongoDB\n');
        
        // Find the test user
        const user = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }
        
        console.log('=== USER INFO ===');
        console.log('User ID:', user._id.toString());
        console.log('Email:', user.email);
        console.log('Role:', user.role);
        
        // Find business by ownerId
        console.log('\n=== SEARCHING FOR BUSINESS ===');
        console.log('Searching with ownerId:', user._id.toString());
        
        const business = await Business.findOne({ ownerId: user._id });
        
        if (!business) {
            console.log('❌ No business found for this user!');
            console.log('\nLet me check all businesses:');
            const allBusinesses = await Business.find();
            console.log(`Found ${allBusinesses.length} businesses total:`);
            allBusinesses.forEach(b => {
                console.log(`  - ${b.businessName} (ownerId: ${b.ownerId})`);
            });
            process.exit(1);
        }
        
        console.log('✅ Business found:', business.businessName);
        console.log('Business ID:', business._id.toString());
        console.log('Owner ID:', business.ownerId.toString());
        
        console.log('\n=== BUSINESS HOURS IN DATABASE ===');
        console.log('Count:', business.businessHours.length);
        business.businessHours.forEach(bh => {
            console.log(`  ${bh.day}: ${bh.isOpen ? `Open ${bh.openTime}-${bh.closeTime}` : 'Closed'}`);
        });
        
        console.log('\n=== SIMULATING CONTROLLER LOGIC ===');
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
                console.log(`${day}: Found - isOpen=${hourData.isOpen}, ${hourData.openTime}-${hourData.closeTime}`);
                businessHours.push(hourData);
            } else {
                console.log(`${day}: NOT FOUND - using defaults`);
                businessHours.push({
                    day: day,
                    isOpen: day !== 'Sunday',
                    openTime: '09:00',
                    closeTime: '18:00'
                });
            }
        });
        
        console.log('\n=== FINAL DATA TO RENDER ===');
        businessHours.forEach(bh => {
            console.log(`  ${bh.day}: ${bh.isOpen ? `Open ${bh.openTime}-${bh.closeTime}` : 'Closed'}`);
        });
        
        console.log('\n✅ Debug complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

debugLoad();

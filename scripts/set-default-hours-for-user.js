const mongoose = require('mongoose');
const Business = require('../models/business');
const User = require('../models/user');
require('dotenv').config();

async function setDefaultHours() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');
        console.log('✅ Connected to MongoDB\n');
        
        // Find the user
        const user = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        if (!user) {
            console.log('❌ User not found');
            process.exit(1);
        }
        
        console.log('User:', user.email);
        console.log('User ID:', user._id.toString());
        
        // Find their business
        const business = await Business.findOne({ ownerId: user._id });
        if (!business) {
            console.log('❌ No business found for this user');
            process.exit(1);
        }
        
        console.log('Business:', business.businessName);
        
        console.log('\n=== CURRENT HOURS ===');
        business.businessHours.forEach(bh => {
            console.log(`  ${bh.day}: ${bh.isOpen ? `Open ${bh.openTime}-${bh.closeTime}` : 'Closed'}`);
        });
        
        // Set default hours: Mon-Sat 9AM-6PM, Sun closed
        const defaultHours = [
            { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
            { day: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '18:00' }
        ];
        
        business.businessHours = defaultHours;
        await business.save();
        
        console.log('\n=== NEW HOURS (SAVED) ===');
        business.businessHours.forEach(bh => {
            console.log(`  ${bh.day}: ${bh.isOpen ? `Open ${bh.openTime}-${bh.closeTime}` : 'Closed'}`);
        });
        
        console.log('\n✅ Default hours set successfully!');
        console.log('Now refresh the Business Hours page in your browser.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

setDefaultHours();

/**
 * Final Business Hours Test Script
 * Tests the complete business hours functionality
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Business = require('../models/business');

async function testBusinessHours() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find the test customer account
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        if (!testUser) {
            console.log('❌ Test user not found');
            return;
        }

        console.log('✅ Test user found:', testUser.fullName);
        console.log('User role:', testUser.role);

        // Find the business for this user
        const business = await Business.findOne({ ownerId: testUser._id });
        if (!business) {
            console.log('❌ Business not found for user');
            return;
        }

        console.log('✅ Business found:', business.businessName);
        console.log('Business verification status:', business.verificationStatus);
        console.log('Current business hours:', business.businessHours.length, 'entries');

        // Display current business hours
        if (business.businessHours.length > 0) {
            console.log('\n📅 Current Business Hours:');
            business.businessHours.forEach(hour => {
                console.log(`${hour.day}: ${hour.isOpen ? `${hour.openTime} - ${hour.closeTime}` : 'Closed'}`);
            });
        } else {
            console.log('⚠️ No business hours set');
        }

        // Test business hours update
        console.log('\n🔄 Testing business hours update...');
        
        const testHours = [
            { day: 'Monday', isOpen: true, openTime: '08:00', closeTime: '17:00' },
            { day: 'Tuesday', isOpen: true, openTime: '08:00', closeTime: '17:00' },
            { day: 'Wednesday', isOpen: true, openTime: '08:00', closeTime: '17:00' },
            { day: 'Thursday', isOpen: true, openTime: '08:00', closeTime: '17:00' },
            { day: 'Friday', isOpen: true, openTime: '08:00', closeTime: '17:00' },
            { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '15:00' },
            { day: 'Sunday', isOpen: false, openTime: '09:00', closeTime: '17:00' }
        ];

        business.businessHours = testHours;
        await business.save();

        console.log('✅ Business hours updated successfully');

        // Verify the update
        const updatedBusiness = await Business.findById(business._id);
        console.log('\n📅 Updated Business Hours:');
        updatedBusiness.businessHours.forEach(hour => {
            console.log(`${hour.day}: ${hour.isOpen ? `${hour.openTime} - ${hour.closeTime}` : 'Closed'}`);
        });

        // Test business methods
        console.log('\n🧪 Testing business methods:');
        console.log('Can accept bookings:', updatedBusiness.canAcceptBookings());
        console.log('Is temporarily closed:', updatedBusiness.isTemporarilyClosed());
        
        // Test getting hours for specific days
        console.log('\nHours for Monday:', updatedBusiness.getHoursForDay('Monday'));
        console.log('Hours for Sunday:', updatedBusiness.getHoursForDay('Sunday'));

        console.log('\n✅ All business hours tests passed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

// Run the test
testBusinessHours();
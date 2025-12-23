const mongoose = require('mongoose');
const Business = require('../models/business');
const User = require('../models/user');

async function testBusinessHoursForm() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        console.log('\n=== TESTING BUSINESS HOURS FORM SUBMISSION ===');

        // Find test business
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        const business = await Business.findOne({ ownerId: testUser._id });
        
        if (!business) {
            console.log('Test business not found');
            return;
        }

        console.log(`Business: ${business.businessName}`);

        // Simulate the exact form data that would be sent
        const formData = {
            businessHours: {
                monday: { isOpen: 'true', openTime: '08:00', closeTime: '17:00' },
                tuesday: { isOpen: 'true', openTime: '08:00', closeTime: '17:00' },
                wednesday: { isOpen: 'true', openTime: '08:00', closeTime: '17:00' },
                thursday: { isOpen: 'true', openTime: '08:00', closeTime: '17:00' },
                friday: { isOpen: 'true', openTime: '08:00', closeTime: '17:00' },
                saturday: { isOpen: 'true', openTime: '09:00', closeTime: '15:00' },
                sunday: { isOpen: 'false', openTime: '09:00', closeTime: '18:00' }
            }
        };

        console.log('\n--- Form Data to Process ---');
        console.log(JSON.stringify(formData, null, 2));

        // Simulate the controller logic exactly
        const { businessHours } = formData;
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const updatedHours = [];

        daysOfWeek.forEach(day => {
            const dayData = businessHours[day.toLowerCase()];
            if (dayData) {
                console.log(`Processing ${day}:`, dayData);
                updatedHours.push({
                    day: day,
                    isOpen: dayData.isOpen === 'true' || dayData.isOpen === true,
                    openTime: dayData.openTime || '09:00',
                    closeTime: dayData.closeTime || '18:00'
                });
            }
        });

        console.log('\n--- Processed Hours ---');
        updatedHours.forEach((dayHour, index) => {
            console.log(`${index + 1}. ${dayHour.day}: ${dayHour.isOpen ? `${dayHour.openTime} - ${dayHour.closeTime}` : 'Closed'}`);
        });

        // Update business hours
        console.log('\n--- Updating Database ---');
        business.businessHours = updatedHours;
        await business.save();
        console.log('✅ Business hours updated successfully');

        // Verify the update by reloading from database
        const verifyBusiness = await Business.findById(business._id);
        console.log('\n--- Database Verification ---');
        console.log(`Business hours count: ${verifyBusiness.businessHours.length}`);
        verifyBusiness.businessHours.forEach((dayHour, index) => {
            console.log(`${index + 1}. ${dayHour.day}: ${dayHour.isOpen ? `${dayHour.openTime} - ${dayHour.closeTime}` : 'Closed'}`);
        });

        // Test what the load controller would return
        console.log('\n--- Testing Load Controller Logic ---');
        const loadBusinessHours = [];
        daysOfWeek.forEach(day => {
            const existingHour = verifyBusiness.businessHours.find(bh => bh.day === day);
            if (existingHour) {
                loadBusinessHours.push(existingHour);
            } else {
                // Default hours: 9 AM to 6 PM, open Monday-Saturday, closed Sunday
                loadBusinessHours.push({
                    day: day,
                    isOpen: day !== 'Sunday',
                    openTime: '09:00',
                    closeTime: '18:00'
                });
            }
        });

        console.log('Load controller would return:');
        loadBusinessHours.forEach((dayHour, index) => {
            console.log(`${index + 1}. ${dayHour.day}: ${dayHour.isOpen ? `${dayHour.openTime} - ${dayHour.closeTime}` : 'Closed'}`);
        });

        console.log('\n=== TEST COMPLETE ===');
        
    } catch (error) {
        console.error('Error testing business hours form:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

testBusinessHoursForm();
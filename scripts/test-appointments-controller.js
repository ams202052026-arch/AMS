const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const User = require('../models/user');
const Service = require('../models/service');
const Staff = require('../models/staff');
const Business = require('../models/business');
const { formatTime12Hour } = require('../utils/timeFormat');

async function testAppointmentsController() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        // Find test user
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        if (!testUser) {
            console.log('Test user not found');
            return;
        }

        console.log(`\n=== TESTING APPOINTMENTS CONTROLLER EXACTLY ===`);
        console.log(`User: ${testUser.fullName}`);

        // Simulate the exact controller logic
        const userId = testUser._id;
        
        console.log('\n1. Running appointment query...');
        const appointments = await Appointment.find({ 
            customer: userId,
            status: { $in: ['pending', 'approved', 'confirmed', 'in-progress'] }
        })
        .populate('service')
        .populate('staff')
        .populate('businessId')
        .sort({ date: 1 });

        console.log(`2. Found ${appointments.length} appointments`);

        if (appointments.length === 0) {
            console.log('❌ Controller would render: "You have no upcoming appointments."');
            return;
        }

        console.log('\n3. Formatting appointments...');
        const formattedAppointments = appointments.map(apt => {
            const aptObj = apt.toObject();
            aptObj.timeSlot.startFormatted = formatTime12Hour(aptObj.timeSlot.start);
            aptObj.timeSlot.endFormatted = formatTime12Hour(aptObj.timeSlot.end);
            return aptObj;
        });

        console.log('4. Formatted appointments data:');
        formattedAppointments.forEach((apt, index) => {
            console.log(`\n--- Appointment ${index + 1} ---`);
            console.log(`ID: ${apt._id}`);
            console.log(`Queue: ${apt.queueNumber}`);
            console.log(`Status: ${apt.status}`);
            console.log(`Service: ${apt.service?.name || 'NULL'}`);
            console.log(`Staff: ${apt.staff?.name || 'NULL'}`);
            console.log(`Business: ${apt.businessId?.businessName || 'NULL'}`);
            console.log(`Date: ${new Date(apt.date).toLocaleDateString()}`);
            console.log(`Time: ${apt.timeSlot.startFormatted} - ${apt.timeSlot.endFormatted}`);
            console.log(`Original time: ${apt.timeSlot.start} - ${apt.timeSlot.end}`);
        });

        // Test what the template would receive
        console.log('\n5. Template data simulation:');
        console.log(`appointments.length = ${formattedAppointments.length}`);
        console.log('Template condition: appointments.length === 0 ?', formattedAppointments.length === 0);
        
        if (formattedAppointments.length === 0) {
            console.log('❌ Template would show: "You have no upcoming appointments."');
        } else {
            console.log('✅ Template would show appointment cards');
            
            // Check for any null/undefined issues that might cause rendering problems
            console.log('\n6. Checking for rendering issues:');
            formattedAppointments.forEach((apt, index) => {
                const issues = [];
                
                if (!apt.service) issues.push('service is null');
                if (!apt.service?.name) issues.push('service.name is null');
                if (!apt.queueNumber) issues.push('queueNumber is null');
                if (!apt.timeSlot.startFormatted) issues.push('startFormatted is null');
                if (!apt.timeSlot.endFormatted) issues.push('endFormatted is null');
                
                if (issues.length > 0) {
                    console.log(`❌ Appointment ${index + 1} issues: ${issues.join(', ')}`);
                } else {
                    console.log(`✅ Appointment ${index + 1} data is complete`);
                }
            });
        }

        // Test the time formatting function
        console.log('\n7. Testing time formatting:');
        const testTimes = ['09:00', '14:30', '18:45'];
        testTimes.forEach(time => {
            try {
                const formatted = formatTime12Hour(time);
                console.log(`${time} → ${formatted}`);
            } catch (error) {
                console.log(`❌ Error formatting ${time}:`, error.message);
            }
        });

        console.log('\n=== CONTROLLER TEST COMPLETE ===');
        
    } catch (error) {
        console.error('Error testing appointments controller:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

testAppointmentsController();
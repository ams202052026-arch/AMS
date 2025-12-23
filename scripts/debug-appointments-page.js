const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const User = require('../models/user');
const Service = require('../models/service');
const Staff = require('../models/staff');
const Business = require('../models/business');

async function debugAppointmentsPage() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        // Find test user
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        if (!testUser) {
            console.log('Test user not found');
            return;
        }

        console.log(`\n=== DEBUGGING APPOINTMENTS PAGE ===`);
        console.log(`User ID: ${testUser._id}`);
        console.log(`User: ${testUser.fullName}`);

        // Simulate exactly what the appointments controller does
        console.log('\n--- Simulating Controller Logic ---');
        
        const userId = testUser._id;
        console.log('1. Finding appointments with query:');
        console.log('   customer:', userId);
        console.log('   status: { $in: [\'pending\', \'approved\', \'confirmed\', \'in-progress\'] }');

        const appointments = await Appointment.find({ 
            customer: userId,
            status: { $in: ['pending', 'approved', 'confirmed', 'in-progress'] }
        })
        .populate('service')
        .populate('staff')
        .populate('businessId')
        .sort({ date: 1 });

        console.log(`\n2. Query result: ${appointments.length} appointments found`);

        if (appointments.length === 0) {
            console.log('❌ NO APPOINTMENTS FOUND - This explains "You have no upcoming appointments"');
            
            // Let's check what appointments actually exist for this user
            console.log('\n--- Checking All User Appointments ---');
            const allAppointments = await Appointment.find({ customer: userId })
                .populate('service', 'name')
                .sort({ date: -1 });
            
            console.log(`Total appointments for user: ${allAppointments.length}`);
            
            if (allAppointments.length > 0) {
                console.log('\nAll appointments:');
                allAppointments.forEach((apt, index) => {
                    console.log(`${index + 1}. Status: "${apt.status}" | Service: ${apt.service?.name} | Queue: ${apt.queueNumber} | Date: ${new Date(apt.date).toLocaleDateString()}`);
                });
                
                // Check which ones should be showing
                console.log('\n--- Status Analysis ---');
                const statusCounts = {};
                allAppointments.forEach(apt => {
                    statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
                });
                
                console.log('Status distribution:');
                Object.keys(statusCounts).forEach(status => {
                    const shouldShow = ['pending', 'approved', 'confirmed', 'in-progress'].includes(status);
                    console.log(`- ${status}: ${statusCounts[status]} ${shouldShow ? '✅ (should show)' : '❌ (should not show)'}`);
                });
            } else {
                console.log('User has no appointments at all');
            }
        } else {
            console.log('\n✅ APPOINTMENTS FOUND:');
            appointments.forEach((apt, index) => {
                console.log(`${index + 1}. Status: "${apt.status}" | Service: ${apt.service?.name} | Queue: ${apt.queueNumber} | Date: ${new Date(apt.date).toLocaleDateString()}`);
            });
        }

        // Check if there are any confirmed appointments specifically
        console.log('\n--- Checking Confirmed Appointments ---');
        const confirmedAppointments = await Appointment.find({ 
            customer: userId,
            status: 'confirmed'
        }).populate('service', 'name');

        console.log(`Confirmed appointments: ${confirmedAppointments.length}`);
        if (confirmedAppointments.length > 0) {
            confirmedAppointments.forEach(apt => {
                console.log(`- ${apt.queueNumber}: ${apt.service?.name} (${new Date(apt.date).toLocaleDateString()})`);
            });
        }

        // Test the exact query from the controller
        console.log('\n--- Testing Exact Controller Query ---');
        try {
            const controllerQuery = { 
                customer: userId,
                status: { $in: ['pending', 'approved', 'confirmed', 'in-progress'] }
            };
            
            console.log('Query object:', JSON.stringify(controllerQuery, null, 2));
            
            const testResult = await Appointment.find(controllerQuery);
            console.log(`Direct query result: ${testResult.length} appointments`);
            
            if (testResult.length > 0) {
                testResult.forEach(apt => {
                    console.log(`- ${apt.status}: ${apt.queueNumber}`);
                });
            }
        } catch (queryError) {
            console.error('Query error:', queryError);
        }

        console.log('\n=== DEBUG COMPLETE ===');
        
    } catch (error) {
        console.error('Error debugging appointments page:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

debugAppointmentsPage();
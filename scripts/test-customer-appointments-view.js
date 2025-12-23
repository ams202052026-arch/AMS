const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const User = require('../models/user');
const Service = require('../models/service');

async function testCustomerAppointmentsView() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        // Find test user
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        if (!testUser) {
            console.log('Test user not found');
            return;
        }

        console.log(`\n=== TESTING CUSTOMER APPOINTMENTS VIEW ===`);
        console.log(`User: ${testUser.fullName}`);

        // Get all appointments for this user
        const allAppointments = await Appointment.find({ customer: testUser._id })
            .populate('service', 'name')
            .sort({ date: -1 });

        console.log(`\nTotal appointments: ${allAppointments.length}`);
        
        // Group by status
        const statusGroups = {};
        allAppointments.forEach(apt => {
            if (!statusGroups[apt.status]) {
                statusGroups[apt.status] = [];
            }
            statusGroups[apt.status].push(apt);
        });

        console.log('\n--- All Appointments by Status ---');
        Object.keys(statusGroups).forEach(status => {
            console.log(`${status.toUpperCase()}: ${statusGroups[status].length}`);
            statusGroups[status].forEach(apt => {
                console.log(`  - ${apt.queueNumber}: ${apt.service?.name || 'Unknown'} (${new Date(apt.date).toLocaleDateString()})`);
            });
        });

        // Test current appointments page logic (active appointments)
        console.log('\n=== APPOINTMENTS PAGE (Active) ===');
        const activeAppointments = await Appointment.find({ 
            customer: testUser._id,
            status: { $in: ['pending', 'approved', 'confirmed', 'in-progress'] }
        })
        .populate('service', 'name')
        .sort({ date: 1 });

        console.log(`Active appointments to show: ${activeAppointments.length}`);
        activeAppointments.forEach(apt => {
            console.log(`✅ ${apt.status.toUpperCase()}: ${apt.service?.name} - ${apt.queueNumber} (${new Date(apt.date).toLocaleDateString()})`);
        });

        // Test history page logic (completed appointments)
        console.log('\n=== HISTORY PAGE (Completed) ===');
        const historyAppointments = await Appointment.find({ 
            customer: testUser._id,
            status: { $in: ['completed', 'cancelled', 'no-show'] }
        })
        .populate('service', 'name')
        .sort({ date: -1 });

        console.log(`History appointments to show: ${historyAppointments.length}`);
        historyAppointments.forEach(apt => {
            console.log(`📋 ${apt.status.toUpperCase()}: ${apt.service?.name} - ${apt.queueNumber} (${new Date(apt.date).toLocaleDateString()})`);
        });

        // Verify the separation is correct
        console.log('\n=== VERIFICATION ===');
        const totalActive = activeAppointments.length;
        const totalHistory = historyAppointments.length;
        const totalAll = allAppointments.length;

        console.log(`✅ Active appointments: ${totalActive}`);
        console.log(`✅ History appointments: ${totalHistory}`);
        console.log(`✅ Total: ${totalActive + totalHistory} (should equal ${totalAll})`);

        if (totalActive + totalHistory === totalAll) {
            console.log('🎉 PERFECT! All appointments are properly categorized');
        } else {
            console.log('❌ ISSUE: Some appointments are missing from both views');
            
            // Find missing appointments
            const activeIds = activeAppointments.map(a => a._id.toString());
            const historyIds = historyAppointments.map(a => a._id.toString());
            const allIds = allAppointments.map(a => a._id.toString());
            
            const missingIds = allIds.filter(id => !activeIds.includes(id) && !historyIds.includes(id));
            if (missingIds.length > 0) {
                console.log('Missing appointments:');
                missingIds.forEach(id => {
                    const apt = allAppointments.find(a => a._id.toString() === id);
                    console.log(`  - ${apt.status}: ${apt.service?.name} - ${apt.queueNumber}`);
                });
            }
        }

        // Test the flow: pending -> confirmed -> completed
        console.log('\n=== APPOINTMENT LIFECYCLE TEST ===');
        console.log('Expected flow:');
        console.log('1. Customer books → status: "pending" → shows in APPOINTMENTS page');
        console.log('2. Business confirms → status: "confirmed" → still shows in APPOINTMENTS page');
        console.log('3. Business starts → status: "in-progress" → still shows in APPOINTMENTS page');
        console.log('4. Business completes → status: "completed" → moves to HISTORY page');
        
        const pendingCount = statusGroups['pending']?.length || 0;
        const confirmedCount = statusGroups['confirmed']?.length || 0;
        const inProgressCount = statusGroups['in-progress']?.length || 0;
        const completedCount = statusGroups['completed']?.length || 0;
        
        console.log(`\nCurrent status distribution:`);
        console.log(`- Pending: ${pendingCount} (should show in appointments)`);
        console.log(`- Confirmed: ${confirmedCount} (should show in appointments)`);
        console.log(`- In-Progress: ${inProgressCount} (should show in appointments)`);
        console.log(`- Completed: ${completedCount} (should show in history)`);

        console.log('\n✅ CUSTOMER APPOINTMENTS VIEW TEST COMPLETE!');
        
    } catch (error) {
        console.error('Error testing customer appointments view:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

testCustomerAppointmentsView();
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');

require('../models/customer');
require('../models/service');
require('../models/staff');
require('../models/appointment');

async function checkAllAppointments() {
    await connectDB();

    const Appointment = mongoose.model('Appointment');
    
    const appointments = await Appointment.find()
        .populate('customer')
        .populate('service')
        .populate('staff')
        .sort({ createdAt: -1 });

    console.log('\n📊 Total appointments in database:', appointments.length);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (appointments.length === 0) {
        console.log('❌ No appointments found!');
        console.log('\n💡 This means:');
        console.log('   1. Customer booking is not saving to database');
        console.log('   2. Or customer is not actually submitting the form');
        console.log('\n🔍 Check:');
        console.log('   - Is customer logged in?');
        console.log('   - Did customer click "Confirm Booking"?');
        console.log('   - Check server console for errors');
    } else {
        appointments.forEach((apt, i) => {
            console.log(`${i + 1}. Queue: ${apt.queueNumber}`);
            console.log(`   Customer: ${apt.customer ? apt.customer.name : 'NULL'}`);
            console.log(`   Service: ${apt.service ? apt.service.name : 'NULL'}`);
            console.log(`   Staff: ${apt.staff ? apt.staff.name : 'Not assigned'}`);
            console.log(`   Status: ${apt.status}`);
            console.log(`   Date: ${apt.date.toLocaleDateString()}`);
            console.log(`   Time: ${apt.timeSlot.start} - ${apt.timeSlot.end}`);
            console.log(`   Created: ${apt.createdAt.toLocaleString()}`);
            console.log('');
        });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
}

checkAllAppointments();

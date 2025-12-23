const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');

// Load all models
require('../models/customer');
require('../models/service');
require('../models/staff');
require('../models/appointment');

async function checkAppointment() {
    await connectDB();

    const Appointment = mongoose.model('Appointment');
    
    const apt = await Appointment.findOne({ queueNumber: 'Q20251127-002' })
        .populate('customer')
        .populate('service')
        .populate('staff');

    console.log('\n📋 Appointment Details:\n');
    console.log('Queue Number:', apt.queueNumber);
    console.log('Customer:', apt.customer ? apt.customer.name : 'NULL');
    console.log('Service:', apt.service ? apt.service.name : 'NULL');
    console.log('Staff:', apt.staff ? apt.staff.name : 'NULL (not assigned)');
    console.log('Status:', apt.status);
    console.log('Date:', apt.date.toLocaleDateString());
    console.log('Time:', apt.timeSlot.start, '-', apt.timeSlot.end);

    if (!apt.staff) {
        console.log('\n⚠️  No staff was assigned during booking');
        console.log('   This is why "Assign..." dropdown appears');
    }

    process.exit(0);
}

checkAppointment();

require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('../models/appointment');

async function checkQueue() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        console.log('📅 Checking appointments for today:', today.toDateString());
        console.log('');

        const appointments = await Appointment.find({
            date: { $gte: today, $lt: tomorrow }
        })
        .populate('customer')
        .populate('service')
        .populate('staff')
        .sort({ 'timeSlot.start': 1 });

        console.log(`Found ${appointments.length} appointments today:\n`);

        appointments.forEach((apt, index) => {
            console.log(`${index + 1}. Queue: ${apt.queueNumber}`);
            console.log(`   Customer: ${apt.customer ? apt.customer.name : 'N/A'}`);
            console.log(`   Service: ${apt.service ? apt.service.name : 'N/A'}`);
            console.log(`   Staff: ${apt.staff ? apt.staff.name : 'Unassigned'}`);
            console.log(`   Time: ${apt.timeSlot.start} - ${apt.timeSlot.end}`);
            console.log(`   Status: ${apt.status}`);
            console.log('');
        });

        const approved = appointments.filter(a => a.status === 'approved');
        const inProgress = appointments.filter(a => a.status === 'in-progress');
        
        console.log(`📊 Summary:`);
        console.log(`   Approved: ${approved.length}`);
        console.log(`   In Progress: ${inProgress.length}`);
        console.log(`   Total for queue: ${approved.length + inProgress.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkQueue();

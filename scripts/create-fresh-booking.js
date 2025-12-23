const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');

require('../models/customer');
require('../models/service');
require('../models/staff');
require('../models/appointment');
require('../models/notification');

async function createFreshBooking() {
    await connectDB();

    const Customer = mongoose.model('Customer');
    const Service = mongoose.model('Service');
    const Staff = mongoose.model('Staff');
    const Appointment = mongoose.model('Appointment');
    const Notification = mongoose.model('Notification');

    console.log('\n🎯 Creating Fresh Booking...\n');

    // Get customer
    const customer = await Customer.findOne({ email: 'customer@test.com' });
    console.log('✅ Customer:', customer.name);

    // Get service
    const service = await Service.findOne({ name: 'Haircut' });
    console.log('✅ Service:', service.name);

    // Get staff
    const staff = await Staff.findOne({ isActive: true });
    console.log('✅ Staff:', staff ? staff.name : 'None');

    // Create appointment for TOMORROW
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(15, 0, 0, 0); // 3 PM

    const appointment = new Appointment({
        customer: customer._id,
        service: service._id,
        staff: staff ? staff._id : null,
        date: tomorrow,
        timeSlot: { start: '15:00', end: '15:30' },
        notes: 'Fresh booking - should appear in admin panel',
        status: 'pending' // Important: pending status
    });

    await appointment.save();

    console.log('\n✅ Appointment Created!');
    console.log('   Queue:', appointment.queueNumber);
    console.log('   Status:', appointment.status);
    console.log('   Date:', appointment.date.toLocaleDateString());
    console.log('   Time:', appointment.timeSlot.start);
    console.log('   Staff:', staff ? staff.name : 'Not assigned');

    // Create notification
    await Notification.create({
        customer: customer._id,
        title: 'Appointment Booked',
        message: `Your appointment has been booked. Queue number: ${appointment.queueNumber}`,
        type: 'appointment_confirm'
    });

    console.log('\n💡 Now check:');
    console.log('   Admin: http://localhost:3000/admin/appointments');
    console.log('   Customer: http://localhost:3000/appointments');
    console.log('\n✅ This appointment should now appear!\n');

    process.exit(0);
}

createFreshBooking();

const mongoose = require('mongoose');
require('dotenv').config();

const Customer = require('../models/customer');
const Service = require('../models/service');
const Appointment = require('../models/appointment');
const Notification = require('../models/notification');
const connectDB = require('../config/db');

async function testBooking() {
    await connectDB();

    console.log('\n🧪 Testing Booking Process\n');

    // Get test customer
    const customer = await Customer.findOne({ email: 'customer@test.com' });
    if (!customer) {
        console.log('❌ Test customer not found. Run: npm run seed');
        process.exit(1);
    }
    console.log('✅ Customer found:', customer.name);

    // Get a service
    const service = await Service.findOne({ isActive: true });
    if (!service) {
        console.log('❌ No services found. Run: npm run seed');
        process.exit(1);
    }
    console.log('✅ Service found:', service.name);

    // Create appointment
    try {
        const appointment = new Appointment({
            customer: customer._id,
            service: service._id,
            date: new Date(),
            timeSlot: { start: '14:00', end: '14:30' },
            notes: 'Test booking'
        });

        await appointment.save();
        console.log('✅ Appointment created!');
        console.log('   Queue Number:', appointment.queueNumber);
        console.log('   Status:', appointment.status);
        console.log('   Date:', appointment.date);

        // Create notification
        await Notification.create({
            customer: customer._id,
            title: 'Appointment Booked',
            message: `Your appointment has been booked. Queue number: ${appointment.queueNumber}`,
            type: 'appointment_confirm'
        });
        console.log('✅ Notification created');

        // Verify it's in database
        const found = await Appointment.findById(appointment._id)
            .populate('customer')
            .populate('service');
        
        console.log('\n📋 Appointment Details:');
        console.log('   Customer:', found.customer.name);
        console.log('   Service:', found.service.name);
        console.log('   Queue:', found.queueNumber);
        console.log('   Status:', found.status);

        console.log('\n✅ Booking test successful!');
        console.log('\n💡 Now check:');
        console.log('   - Admin Dashboard: http://localhost:3000/admin/dashboard');
        console.log('   - Admin Appointments: http://localhost:3000/admin/appointments');
        console.log('   - Customer Appointments: http://localhost:3000/appointments');

    } catch (error) {
        console.error('❌ Error creating appointment:', error.message);
        console.error(error);
    }

    process.exit(0);
}

testBooking().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});

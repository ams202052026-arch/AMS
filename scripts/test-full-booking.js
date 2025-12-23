const mongoose = require('mongoose');
require('dotenv').config();

const Customer = require('../models/customer');
const Service = require('../models/service');
const Appointment = require('../models/appointment');
const connectDB = require('../config/db');

async function testFullBooking() {
    await connectDB();

    console.log('\n🧪 Testing Full Booking Flow\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Get customer
    const customer = await Customer.findOne({ email: 'customer@test.com' });
    if (!customer) {
        console.log('❌ Customer not found');
        process.exit(1);
    }
    console.log('✅ Customer found:', customer.name);
    console.log('   Customer ID:', customer._id);

    // 2. Get service
    const service = await Service.findOne({ isActive: true });
    if (!service) {
        console.log('❌ No services found');
        process.exit(1);
    }
    console.log('✅ Service found:', service.name);
    console.log('   Service ID:', service._id);

    // 3. Create appointment (simulating form submission)
    const bookingData = {
        customer: customer._id,
        service: service._id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        timeSlot: { start: '10:00', end: '10:30' },
        notes: 'Test booking from script'
    };

    console.log('\n📝 Creating appointment with data:');
    console.log('   Customer:', customer.name);
    console.log('   Service:', service.name);
    console.log('   Date:', bookingData.date.toLocaleDateString());
    console.log('   Time:', bookingData.timeSlot.start, '-', bookingData.timeSlot.end);

    try {
        const appointment = new Appointment(bookingData);
        await appointment.save();

        console.log('\n✅ Appointment created successfully!');
        console.log('   Queue Number:', appointment.queueNumber);
        console.log('   Status:', appointment.status);
        console.log('   ID:', appointment._id);

        // 4. Verify it's in database
        const found = await Appointment.findById(appointment._id)
            .populate('customer')
            .populate('service');

        console.log('\n✅ Verified in database:');
        console.log('   Customer:', found.customer.name);
        console.log('   Service:', found.service.name);
        console.log('   Queue:', found.queueNumber);

        // 5. Check if it appears in customer's appointments
        const customerAppointments = await Appointment.find({
            customer: customer._id,
            status: { $in: ['pending', 'approved', 'in-progress'] }
        });
        console.log('\n✅ Customer has', customerAppointments.length, 'active appointment(s)');

        // 6. Check if it appears in admin view
        const allAppointments = await Appointment.find()
            .populate('customer')
            .populate('service');
        console.log('✅ Total appointments in system:', allAppointments.length);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✅ Full booking flow test PASSED!');
        console.log('\n💡 Now check:');
        console.log('   Customer view: http://localhost:3000/appointments');
        console.log('   Admin view: http://localhost:3000/admin/appointments');
        console.log('\n');

    } catch (error) {
        console.error('\n❌ Error creating appointment:', error.message);
        console.error(error);
    }

    process.exit(0);
}

testFullBooking().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});

require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const Customer = require('../models/customer');
const Service = require('../models/service');
const Staff = require('../models/staff');

async function createTestQueue() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        // Get first customer, service, and staff
        const customer = await Customer.findOne();
        const services = await Service.find({ isActive: true }).limit(3);
        const staff = await Staff.find({ isActive: true }).limit(2);

        if (!customer || services.length === 0 || staff.length === 0) {
            console.log('❌ Need at least 1 customer, 1 service, and 1 staff member');
            process.exit(1);
        }

        console.log('📋 Creating test appointments for TODAY...\n');

        // Create appointments for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const testAppointments = [
            {
                customer: customer._id,
                service: services[0]._id,
                staff: staff[0]._id,
                date: today,
                timeSlot: { start: '09:00', end: '10:00' },
                status: 'approved',
                queueNumber: 'A001'
            },
            {
                customer: customer._id,
                service: services[1] ? services[1]._id : services[0]._id,
                staff: staff[0]._id,
                date: today,
                timeSlot: { start: '10:00', end: '11:00' },
                status: 'approved',
                queueNumber: 'A002'
            },
            {
                customer: customer._id,
                service: services[2] ? services[2]._id : services[0]._id,
                staff: staff[1] ? staff[1]._id : staff[0]._id,
                date: today,
                timeSlot: { start: '11:00', end: '12:00' },
                status: 'approved',
                queueNumber: 'B001'
            }
        ];

        for (const apt of testAppointments) {
            const created = await Appointment.create(apt);
            console.log(`✅ Created: ${created.queueNumber} - ${apt.timeSlot.start}`);
        }

        console.log('\n🎉 Test queue created successfully!');
        console.log('\n📍 Now go to: /admin/queue');
        console.log('   You should see 3 appointments ready to serve\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createTestQueue();

const mongoose = require('mongoose');
require('dotenv').config();

const Admin = require('../models/admin');
const Customer = require('../models/customer');
const Service = require('../models/service');
const Staff = require('../models/staff');
const Appointment = require('../models/appointment');
const connectDB = require('../config/db');

async function testCore() {
    await connectDB();

    console.log('\n🧪 Testing Core Functionalities\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test 1: Check Admin exists
    console.log('1️⃣  Testing Admin Login...');
    const admin = await Admin.findOne({ username: 'admin' });
    if (admin) {
        console.log('   ✅ Admin account exists');
        console.log('   Username:', admin.username);
    } else {
        console.log('   ❌ Admin account not found - run npm run seed');
    }

    // Test 2: Check Customer exists
    console.log('\n2️⃣  Testing Customer Login...');
    const customer = await Customer.findOne({ email: 'customer@test.com' });
    if (customer) {
        console.log('   ✅ Test customer exists');
        console.log('   Email:', customer.email);
        console.log('   Verified:', customer.isVerified);
        console.log('   Points:', customer.rewardPoints);
    } else {
        console.log('   ❌ Test customer not found - run npm run seed');
    }

    // Test 3: Check Services
    console.log('\n3️⃣  Testing Services...');
    const services = await Service.find({ isActive: true });
    console.log('   ✅ Active services:', services.length);
    if (services.length > 0) {
        console.log('   Sample:', services[0].name, '-', '₱' + services[0].price);
    } else {
        console.log('   ⚠️  No services found - run npm run seed');
    }

    // Test 4: Check Staff
    console.log('\n4️⃣  Testing Staff...');
    const staff = await Staff.find({ isActive: true });
    console.log('   ✅ Active staff:', staff.length);
    if (staff.length > 0) {
        console.log('   Sample:', staff[0].name);
    } else {
        console.log('   ⚠️  No staff found - run npm run seed');
    }

    // Test 5: Test Service Creation
    console.log('\n5️⃣  Testing Service Creation...');
    try {
        const testService = new Service({
            name: 'Test Service',
            description: 'Test description',
            price: 100,
            duration: 30,
            category: 'other',
            pointsEarned: 10
        });
        await testService.save();
        console.log('   ✅ Service creation works');
        await Service.findByIdAndDelete(testService._id);
        console.log('   ✅ Service deletion works');
    } catch (error) {
        console.log('   ❌ Service creation failed:', error.message);
    }

    // Test 6: Test Appointment Creation
    console.log('\n6️⃣  Testing Appointment Creation...');
    if (customer && services.length > 0) {
        try {
            const testAppointment = new Appointment({
                customer: customer._id,
                service: services[0]._id,
                date: new Date(),
                timeSlot: { start: '10:00', end: '10:30' }
            });
            await testAppointment.save();
            console.log('   ✅ Appointment creation works');
            console.log('   Queue Number:', testAppointment.queueNumber);
            await Appointment.findByIdAndDelete(testAppointment._id);
            console.log('   ✅ Appointment deletion works');
        } catch (error) {
            console.log('   ❌ Appointment creation failed:', error.message);
        }
    } else {
        console.log('   ⚠️  Cannot test - missing customer or services');
    }

    // Test 7: Check Appointments
    console.log('\n7️⃣  Checking Existing Appointments...');
    const appointments = await Appointment.find().populate('customer').populate('service');
    console.log('   Total appointments:', appointments.length);
    if (appointments.length > 0) {
        const recent = appointments[appointments.length - 1];
        console.log('   Latest:', recent.queueNumber, '-', recent.service?.name);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Core functionality test complete!\n');
    
    process.exit(0);
}

testCore().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});

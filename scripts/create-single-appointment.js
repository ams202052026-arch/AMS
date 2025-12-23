require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const Customer = require('../models/customer');
const Service = require('../models/service');
const Staff = require('../models/staff');

async function createSingleAppointment() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        // Get the most recent customer (your new account)
        const customer = await Customer.findOne().sort({ _id: -1 });
        if (!customer) {
            console.log('❌ No customer found. Please create an account first.');
            process.exit(1);
        }

        // Find Haircut service
        const haircutService = await Service.findOne({ name: /haircut/i });
        if (!haircutService) {
            console.log('❌ Haircut service not found. Available services:');
            const services = await Service.find();
            services.forEach(s => console.log(`   - ${s.name}`));
            process.exit(1);
        }

        // Get first active staff
        const staff = await Staff.findOne({ isActive: true });
        if (!staff) {
            console.log('❌ No active staff found');
            process.exit(1);
        }

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Generate queue number
        const existingCount = await Appointment.countDocuments({
            date: today
        });
        const queueNumber = `A${String(existingCount + 1).padStart(3, '0')}`;

        console.log('📋 Creating appointment...\n');
        console.log(`   Customer: ${customer.name} (${customer.email})`);
        console.log(`   Service: ${haircutService.name}`);
        console.log(`   Staff: ${staff.name}`);
        console.log(`   Time: 11:10 - 11:20`);
        console.log(`   Queue: ${queueNumber}\n`);

        // Create appointment
        const appointment = await Appointment.create({
            customer: customer._id,
            service: haircutService._id,
            staff: staff._id,
            date: today,
            timeSlot: { 
                start: '11:10', 
                end: '11:20' 
            },
            status: 'approved',
            queueNumber: queueNumber,
            finalPrice: haircutService.price
        });

        console.log('✅ Appointment created successfully!');
        console.log(`   ID: ${appointment._id}`);
        console.log(`   Queue Number: ${appointment.queueNumber}`);
        console.log(`   Status: ${appointment.status}`);
        
        console.log('\n📍 Next steps:');
        console.log('   1. Go to /admin/queue to see the appointment');
        console.log('   2. Click "Start Serving" to test notification');
        console.log(`   3. Login as ${customer.email} to see notifications\n`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createSingleAppointment();

require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const Customer = require('../models/customer');
const Service = require('../models/service');
const Staff = require('../models/staff');

async function createHaircutQueue() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('✅ Connected to database\n');

        // Find Haircut service
        const haircutService = await Service.findOne({ name: /haircut/i });
        if (!haircutService) {
            console.log('❌ Haircut service not found. Available services:');
            const services = await Service.find();
            services.forEach(s => console.log(`   - ${s.name}`));
            process.exit(1);
        }

        // Get customer and staff
        const customer = await Customer.findOne();
        const staff = await Staff.findOne({ isActive: true });

        if (!customer || !staff) {
            console.log('❌ Need at least 1 customer and 1 staff member');
            process.exit(1);
        }

        console.log('📋 Creating 3 Haircut appointments for TODAY at 11:00-11:10...\n');
        console.log(`   Service: ${haircutService.name}`);
        console.log(`   Customer: ${customer.name}`);
        console.log(`   Staff: ${staff.name}\n`);

        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Create 3 appointments
        const appointments = [];
        for (let i = 0; i < 3; i++) {
            const queueNumber = `A${String(i + 1).padStart(3, '0')}`;
            
            const apt = await Appointment.create({
                customer: customer._id,
                service: haircutService._id,
                staff: staff._id,
                date: today,
                timeSlot: { 
                    start: '11:00', 
                    end: '11:10' 
                },
                status: 'approved',
                queueNumber: queueNumber,
                finalPrice: haircutService.price
            });

            appointments.push(apt);
            console.log(`✅ Created: ${queueNumber} - ${customer.name} - Haircut - 11:00-11:10`);
        }

        console.log('\n🎉 3 Haircut appointments created successfully!');
        console.log('\n📍 Now go to: /admin/queue');
        console.log('   You should see 3 appointments for today\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createHaircutQueue();

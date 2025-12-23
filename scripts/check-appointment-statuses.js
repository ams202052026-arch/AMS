const mongoose = require('mongoose');
const Appointment = require('../models/appointment');

async function checkAppointmentStatuses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        // Get all unique appointment statuses in the database
        console.log('\n=== CHECKING APPOINTMENT STATUSES IN DATABASE ===');
        
        const statusCounts = await Appointment.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        console.log('Current appointment statuses in database:');
        statusCounts.forEach(status => {
            console.log(`- ${status._id}: ${status.count} appointments`);
        });

        // Check model enum
        console.log('\n=== APPOINTMENT MODEL ENUM ===');
        const appointmentSchema = Appointment.schema.paths.status;
        console.log('Allowed statuses in model:', appointmentSchema.enumValues);

        // Find appointments with 'confirmed' status
        console.log('\n=== APPOINTMENTS WITH CONFIRMED STATUS ===');
        const confirmedAppointments = await Appointment.find({ status: 'confirmed' })
            .populate('customer', 'firstName lastName')
            .populate('service', 'name')
            .limit(5);

        if (confirmedAppointments.length > 0) {
            console.log(`Found ${confirmedAppointments.length} appointments with 'confirmed' status:`);
            confirmedAppointments.forEach(apt => {
                console.log(`- ${apt.queueNumber}: ${apt.customer?.firstName} ${apt.customer?.lastName} - ${apt.service?.name}`);
            });
        } else {
            console.log('No appointments found with "confirmed" status');
        }

        // Check what customer appointments page should show
        console.log('\n=== CUSTOMER APPOINTMENTS PAGE LOGIC ===');
        const testUserId = await mongoose.connection.db.collection('users').findOne({ email: 'alphi.fidelino@lspu.edu.ph' }, { _id: 1 });
        
        if (testUserId) {
            const activeAppointments = await Appointment.find({
                customer: testUserId._id,
                status: { $in: ['pending', 'approved', 'in-progress'] }
            }).populate('service', 'name');

            const confirmedAppointments = await Appointment.find({
                customer: testUserId._id,
                status: 'confirmed'
            }).populate('service', 'name');

            console.log(`Current logic shows ${activeAppointments.length} active appointments:`);
            activeAppointments.forEach(apt => {
                console.log(`- ${apt.status}: ${apt.service?.name} (${apt.queueNumber})`);
            });

            console.log(`Missing ${confirmedAppointments.length} confirmed appointments:`);
            confirmedAppointments.forEach(apt => {
                console.log(`- ${apt.status}: ${apt.service?.name} (${apt.queueNumber})`);
            });
        }

        console.log('\n=== RECOMMENDATION ===');
        if (statusCounts.find(s => s._id === 'confirmed')) {
            console.log('✅ SOLUTION: Add "confirmed" to appointment model enum and customer appointments filter');
        } else {
            console.log('✅ SOLUTION: Change business owner controller to use "approved" instead of "confirmed"');
        }
        
    } catch (error) {
        console.error('Error checking appointment statuses:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

checkAppointmentStatuses();
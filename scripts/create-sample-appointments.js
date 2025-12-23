const mongoose = require('mongoose');
const Business = require('../models/business');
const Service = require('../models/service');
const Staff = require('../models/staff');
const Appointment = require('../models/appointment');
const User = require('../models/user');
require('dotenv').config();

async function createSampleAppointments() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/appointment-system');
        console.log('✅ Connected to MongoDB\n');
        
        // Find the user's business
        const user = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        const business = await Business.findOne({ ownerId: user._id });
        
        if (!business) {
            console.log('❌ Business not found');
            process.exit(1);
        }
        
        console.log('Business:', business.businessName);
        
        // Get services and staff
        const services = await Service.find({ businessId: business._id });
        const staff = await Staff.find({ businessId: business._id });
        
        if (services.length === 0) {
            console.log('❌ No services found. Please add services first.');
            process.exit(1);
        }
        
        if (staff.length === 0) {
            console.log('❌ No staff found. Please add staff first.');
            process.exit(1);
        }
        
        console.log(`Found ${services.length} services and ${staff.length} staff\n`);
        
        // Create sample appointments for the last 30 days
        const appointments = [];
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Create 2-5 appointments per day
            const appointmentsPerDay = Math.floor(Math.random() * 4) + 2;
            
            for (let j = 0; j < appointmentsPerDay; j++) {
                const service = services[Math.floor(Math.random() * services.length)];
                const staffMember = staff[Math.floor(Math.random() * staff.length)];
                
                // Random status (mostly completed)
                const statuses = ['completed', 'completed', 'completed', 'completed', 'cancelled'];
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                
                // Random time
                const hour = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
                const startTime = `${hour.toString().padStart(2, '0')}:00`;
                const endHour = hour + Math.floor(service.duration / 60);
                const endTime = `${endHour.toString().padStart(2, '0')}:00`;
                
                appointments.push({
                    businessId: business._id,
                    customer: user._id,
                    service: service._id,
                    staff: staffMember._id,
                    date: date,
                    timeSlot: {
                        start: startTime,
                        end: endTime
                    },
                    startTime: startTime,
                    endTime: endTime,
                    status: status,
                    finalPrice: service.price,
                    createdAt: new Date(date.getTime() - 86400000) // Created 1 day before
                });
            }
        }
        
        console.log(`Creating ${appointments.length} sample appointments...`);
        
        // Delete existing appointments for this business
        await Appointment.deleteMany({ businessId: business._id });
        console.log('Deleted existing appointments');
        
        // Insert new appointments
        await Appointment.insertMany(appointments);
        
        console.log(`✅ Created ${appointments.length} sample appointments!\n`);
        
        // Show summary
        const completed = appointments.filter(a => a.status === 'completed').length;
        const cancelled = appointments.filter(a => a.status === 'cancelled').length;
        const totalRevenue = appointments
            .filter(a => a.status === 'completed')
            .reduce((sum, a) => sum + a.finalPrice, 0);
        
        console.log('=== SUMMARY ===');
        console.log(`Total Appointments: ${appointments.length}`);
        console.log(`Completed: ${completed}`);
        console.log(`Cancelled: ${cancelled}`);
        console.log(`Total Revenue: ₱${totalRevenue.toLocaleString()}`);
        console.log(`\nNow you can generate reports with data!`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

createSampleAppointments();

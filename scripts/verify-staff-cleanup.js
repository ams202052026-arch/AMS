const mongoose = require('mongoose');
require('dotenv').config();

const Staff = require('../models/staff');
const Business = require('../models/business');

async function verifyStaffCleanup() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const allStaff = await Staff.find({}).populate('businessId');
        
        console.log('👥 All Staff Members:\n');
        
        allStaff.forEach((staff, index) => {
            const businessName = staff.businessId ? staff.businessId.businessName : 'Unknown';
            console.log(`${index + 1}. ${staff.name}`);
            console.log(`   Business: ${businessName}`);
            console.log(`   Email: ${staff.email}`);
            console.log(`   Appointments Completed: ${staff.appointmentsCompleted}`);
            console.log(`   Rating: ${staff.rating}`);
            console.log(`   Active: ${staff.isActive}`);
            console.log('');
        });

        const staffWithData = allStaff.filter(s => s.appointmentsCompleted > 0 || s.rating > 0);
        
        if (staffWithData.length === 0) {
            console.log('✅ All staff statistics are clean (0 appointments, 0 rating)');
        } else {
            console.log(`⚠️  ${staffWithData.length} staff members still have statistics`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

verifyStaffCleanup();

const mongoose = require('mongoose');
require('dotenv').config();

const Business = require('../models/business');
const User = require('../models/user');
const Service = require('../models/service');
const Staff = require('../models/staff');
const Appointment = require('../models/appointment');

async function deleteTestingRegisterBusiness() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Find the business
        const business = await Business.findOne({ businessName: 'TESTING REGISTER' }).populate('ownerId');
        
        if (!business) {
            console.log('❌ Business "TESTING REGISTER" not found');
            return;
        }

        console.log('📋 Business Found:');
        console.log(`   Business Name: ${business.businessName}`);
        console.log(`   Business ID: ${business._id}`);
        console.log(`   Owner Email: ${business.ownerId ? business.ownerId.email : 'N/A'}`);
        console.log(`   Owner Name: ${business.ownerId ? business.ownerId.firstName + ' ' + business.ownerId.lastName : 'N/A'}`);
        console.log(`   Status: ${business.verificationStatus}\n`);

        const businessId = business._id;
        const ownerId = business.ownerId ? business.ownerId._id : null;

        // Check related data
        const servicesCount = await Service.countDocuments({ businessId });
        const staffCount = await Staff.countDocuments({ businessId });
        const appointmentsCount = await Appointment.countDocuments({ businessId });

        console.log('📊 Related Data:');
        console.log(`   Services: ${servicesCount}`);
        console.log(`   Staff: ${staffCount}`);
        console.log(`   Appointments: ${appointmentsCount}\n`);

        // Delete related data
        console.log('🗑️  Deleting business data...\n');

        // Delete services
        if (servicesCount > 0) {
            const deletedServices = await Service.deleteMany({ businessId });
            console.log(`✓ Deleted ${deletedServices.deletedCount} services`);
        }

        // Delete staff
        if (staffCount > 0) {
            const deletedStaff = await Staff.deleteMany({ businessId });
            console.log(`✓ Deleted ${deletedStaff.deletedCount} staff members`);
        }

        // Delete appointments
        if (appointmentsCount > 0) {
            const deletedAppointments = await Appointment.deleteMany({ businessId });
            console.log(`✓ Deleted ${deletedAppointments.deletedCount} appointments`);
        }

        // Delete the business
        await Business.deleteOne({ _id: businessId });
        console.log(`✓ Deleted business: ${business.businessName}`);

        // Check if owner still exists as customer
        if (ownerId) {
            const user = await User.findById(ownerId);
            if (user) {
                console.log('\n✅ Customer account preserved:');
                console.log(`   Email: ${user.email}`);
                console.log(`   Name: ${user.firstName} ${user.lastName}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Status: ${user.isBanned ? 'Banned' : 'Active'}`);
            }
        }

        console.log('\n✅ Business "TESTING REGISTER" has been deleted successfully!');
        console.log('✅ Customer account remains active in the system.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
}

deleteTestingRegisterBusiness();

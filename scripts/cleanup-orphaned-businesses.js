const mongoose = require('mongoose');
require('dotenv').config();

const Business = require('../models/business');
const Service = require('../models/service');
const Staff = require('../models/staff');
const Appointment = require('../models/appointment');
const User = require('../models/user');

async function cleanupOrphanedBusinesses() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('🔍 Searching for orphaned businesses...\n');

        // Find all businesses
        const allBusinesses = await Business.find({});
        console.log(`Found ${allBusinesses.length} total businesses\n`);

        const orphanedBusinesses = [];

        // Check each business for deleted owner
        for (const business of allBusinesses) {
            const owner = await User.findById(business.ownerId);
            
            if (!owner) {
                orphanedBusinesses.push(business);
                console.log(`❌ Orphaned Business Found:`);
                console.log(`   Name: ${business.businessName}`);
                console.log(`   ID: ${business._id}`);
                console.log(`   Owner ID: ${business.ownerId} (DELETED)`);
                console.log(`   Status: ${business.verificationStatus}`);
                console.log('');
            }
        }

        if (orphanedBusinesses.length === 0) {
            console.log('✅ No orphaned businesses found! All businesses have valid owners.');
            return;
        }

        console.log(`\n⚠️  Found ${orphanedBusinesses.length} orphaned business(es)\n`);
        console.log('🗑️  Cleaning up orphaned businesses...\n');

        for (const business of orphanedBusinesses) {
            console.log(`Deleting: ${business.businessName}`);
            
            // Delete appointments to this business
            const deletedAppointments = await Appointment.deleteMany({ businessId: business._id });
            console.log(`   ✓ Deleted ${deletedAppointments.deletedCount} appointments`);
            
            // Delete services from this business
            const deletedServices = await Service.deleteMany({ businessId: business._id });
            console.log(`   ✓ Deleted ${deletedServices.deletedCount} services`);
            
            // Delete staff from this business
            const deletedStaff = await Staff.deleteMany({ businessId: business._id });
            console.log(`   ✓ Deleted ${deletedStaff.deletedCount} staff members`);
            
            // Delete the business
            await Business.findByIdAndDelete(business._id);
            console.log(`   ✓ Deleted business\n`);
        }

        console.log('✅ CLEANUP COMPLETE!');
        console.log(`   Removed ${orphanedBusinesses.length} orphaned business(es)`);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

cleanupOrphanedBusinesses();

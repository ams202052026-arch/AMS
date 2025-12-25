const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Appointment = require('../models/appointment');
const Notification = require('../models/notification');
const { Redemption } = require('../models/reward');
const Service = require('../models/service');
const Business = require('../models/business');
const Staff = require('../models/staff');

async function cleanupAllBookingData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('⚠️  WARNING: This will delete ALL booking data from the system!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Count existing data
        const appointmentCount = await Appointment.countDocuments({});
        const notificationCount = await Notification.countDocuments({});
        const redemptionCount = await Redemption.countDocuments({});
        const usersWithPoints = await User.countDocuments({ rewardPoints: { $gt: 0 } });
        const staffWithCompletions = await Staff.countDocuments({ appointmentsCompleted: { $gt: 0 } });

        console.log('📊 Current System Data:');
        console.log('   Total Appointments:', appointmentCount);
        console.log('   Total Notifications:', notificationCount);
        console.log('   Total Redemptions:', redemptionCount);
        console.log('   Users with Reward Points:', usersWithPoints);
        console.log('   Staff with Completed Appointments:', staffWithCompletions);
        console.log('');

        if (appointmentCount === 0 && notificationCount === 0 && redemptionCount === 0 && usersWithPoints === 0 && staffWithCompletions === 0) {
            console.log('✅ System is already clean! No booking data found.');
            return;
        }

        // Show appointment breakdown by status
        if (appointmentCount > 0) {
            console.log('📋 Appointments Breakdown:');
            const statuses = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
            for (const status of statuses) {
                const count = await Appointment.countDocuments({ status });
                if (count > 0) {
                    console.log(`   ${status}: ${count}`);
                }
            }
            console.log('');
        }

        // Show notification breakdown by type
        if (notificationCount > 0) {
            console.log('📧 Notifications Breakdown:');
            const types = await Notification.distinct('type');
            for (const type of types) {
                const count = await Notification.countDocuments({ type });
                console.log(`   ${type || 'general'}: ${count}`);
            }
            console.log('');
        }

        console.log('🗑️  Starting cleanup process...\n');

        // 1. Delete all appointments
        console.log('1️⃣  Deleting all appointments...');
        const deletedAppointments = await Appointment.deleteMany({});
        console.log(`   ✅ Deleted ${deletedAppointments.deletedCount} appointments`);

        // 2. Delete all notifications
        console.log('2️⃣  Deleting all notifications...');
        const deletedNotifications = await Notification.deleteMany({});
        console.log(`   ✅ Deleted ${deletedNotifications.deletedCount} notifications`);

        // 3. Delete all redemptions
        console.log('3️⃣  Deleting all redemptions...');
        const deletedRedemptions = await Redemption.deleteMany({});
        console.log(`   ✅ Deleted ${deletedRedemptions.deletedCount} redemptions`);

        // 4. Reset all user reward points to 0
        console.log('4️⃣  Resetting all user reward points...');
        const updatedUsers = await User.updateMany(
            { rewardPoints: { $gt: 0 } },
            { $set: { rewardPoints: 0 } }
        );
        console.log(`   ✅ Reset reward points for ${updatedUsers.modifiedCount} users`);

        // 5. Reset business statistics
        console.log('5️⃣  Resetting business statistics...');
        const updatedBusinesses = await Business.updateMany(
            {},
            { 
                $set: { 
                    totalBookings: 0,
                    completedBookings: 0
                } 
            }
        );
        console.log(`   ✅ Reset statistics for ${updatedBusinesses.modifiedCount} businesses`);

        // 6. Reset staff statistics
        console.log('6️⃣  Resetting staff statistics...');
        const updatedStaff = await Staff.updateMany(
            { appointmentsCompleted: { $gt: 0 } },
            { 
                $set: { 
                    appointmentsCompleted: 0,
                    rating: 0
                } 
            }
        );
        console.log(`   ✅ Reset statistics for ${updatedStaff.modifiedCount} staff members`);

        console.log('');
        console.log('✅ CLEANUP COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Summary:');
        console.log(`   ✓ Deleted ${deletedAppointments.deletedCount} appointments`);
        console.log(`   ✓ Deleted ${deletedNotifications.deletedCount} notifications`);
        console.log(`   ✓ Deleted ${deletedRedemptions.deletedCount} redemptions`);
        console.log(`   ✓ Reset reward points for ${updatedUsers.modifiedCount} users`);
        console.log(`   ✓ Reset statistics for ${updatedBusinesses.modifiedCount} businesses`);
        console.log(`   ✓ Reset statistics for ${updatedStaff.modifiedCount} staff members`);
        console.log('');
        console.log('🎉 System is now clean with no booking history!');
        console.log('   All users, businesses, services, and staff remain intact.');
        console.log('   Only booking-related data has been removed.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

cleanupAllBookingData();

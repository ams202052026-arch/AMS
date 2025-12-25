const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Appointment = require('../models/appointment');
const Notification = require('../models/notification');
const { Redemption } = require('../models/reward');
const Service = require('../models/service');
const Business = require('../models/business');

async function cleanupSampleUserBookings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find Sample User
        const sampleUser = await User.findOne({ email: 'sample.user@gmail.com' });
        
        if (!sampleUser) {
            console.log('❌ Sample User not found');
            return;
        }

        console.log('👤 Sample User Found:');
        console.log('   Name:', sampleUser.name);
        console.log('   Email:', sampleUser.email);
        console.log('   ID:', sampleUser._id);
        console.log('');

        // Count existing data
        const appointmentCount = await Appointment.countDocuments({ customer: sampleUser._id });
        const notificationCount = await Notification.countDocuments({ customer: sampleUser._id });
        const redemptionCount = await Redemption.countDocuments({ customer: sampleUser._id });

        console.log('📊 Current Data:');
        console.log('   Appointments:', appointmentCount);
        console.log('   Notifications:', notificationCount);
        console.log('   Redemptions:', redemptionCount);
        console.log('   Reward Points:', sampleUser.rewardPoints || 0);
        console.log('');

        if (appointmentCount === 0 && notificationCount === 0 && redemptionCount === 0) {
            console.log('✅ No booking data to clean up!');
            return;
        }

        // Show appointments before deletion
        if (appointmentCount > 0) {
            console.log('📋 Appointments to be deleted:');
            const appointments = await Appointment.find({ customer: sampleUser._id })
                .populate('service')
                .populate('businessId')
                .sort({ date: -1 });
            
            appointments.forEach((apt, index) => {
                const serviceName = apt.service ? apt.service.name : 'Unknown';
                const businessName = apt.businessId ? apt.businessId.businessName : 'Unknown';
                const dateStr = apt.date.toLocaleDateString();
                console.log(`   ${index + 1}. ${serviceName} - ${businessName} (${dateStr}) - ${apt.status}`);
            });
            console.log('');
        }

        // Delete all appointments
        console.log('🗑️  Deleting appointments...');
        const deletedAppointments = await Appointment.deleteMany({ customer: sampleUser._id });
        console.log(`   ✅ Deleted ${deletedAppointments.deletedCount} appointments`);

        // Delete all notifications
        console.log('🗑️  Deleting notifications...');
        const deletedNotifications = await Notification.deleteMany({ customer: sampleUser._id });
        console.log(`   ✅ Deleted ${deletedNotifications.deletedCount} notifications`);

        // Delete all redemptions
        console.log('🗑️  Deleting redemptions...');
        const deletedRedemptions = await Redemption.deleteMany({ customer: sampleUser._id });
        console.log(`   ✅ Deleted ${deletedRedemptions.deletedCount} redemptions`);

        // Reset reward points to 0
        console.log('🔄 Resetting reward points...');
        sampleUser.rewardPoints = 0;
        await sampleUser.save();
        console.log('   ✅ Reward points reset to 0');

        console.log('');
        console.log('✅ CLEANUP COMPLETE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Summary:');
        console.log(`   - Deleted ${deletedAppointments.deletedCount} appointments`);
        console.log(`   - Deleted ${deletedNotifications.deletedCount} notifications`);
        console.log(`   - Deleted ${deletedRedemptions.deletedCount} redemptions`);
        console.log('   - Reset reward points to 0');
        console.log('');
        console.log('Sample User account is now clean with no booking history.');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

cleanupSampleUserBookings();

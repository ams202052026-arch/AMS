const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Appointment = require('../models/appointment');
const Notification = require('../models/notification');
const { Redemption } = require('../models/reward');

async function updateSampleUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const oldEmail = 'alphi.fidelino@lspu.edu.ph';
        const newEmail = 'sample.user@gmail.com';
        const newFirstName = 'Sample';
        const newLastName = 'User';

        // Find the user
        const user = await User.findOne({ email: oldEmail });
        
        if (!user) {
            console.log('❌ User not found with email:', oldEmail);
            await mongoose.connection.close();
            process.exit(1);
        }

        console.log(`\n📋 Found user: ${user.firstName} ${user.lastName} (${user.email})`);
        console.log(`   Role: ${user.role}`);
        console.log(`   User ID: ${user._id}`);

        // Delete all appointments (as customer)
        const appointmentsDeleted = await Appointment.deleteMany({ customer: user._id });
        console.log(`\n🗑️  Deleted ${appointmentsDeleted.deletedCount} appointments`);

        // Delete all notifications
        const notificationsDeleted = await Notification.deleteMany({ customer: user._id });
        console.log(`🗑️  Deleted ${notificationsDeleted.deletedCount} notifications`);

        // Delete all redemptions
        const redemptionsDeleted = await Redemption.deleteMany({ customer: user._id });
        console.log(`🗑️  Deleted ${redemptionsDeleted.deletedCount} redemptions`);

        // Reset reward points
        user.rewardPoints = 0;

        // Update user info
        user.email = newEmail;
        user.firstName = newFirstName;
        user.lastName = newLastName;
        
        await user.save();

        console.log(`\n✅ User updated successfully!`);
        console.log(`   New Email: ${user.email}`);
        console.log(`   New Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Reward Points: ${user.rewardPoints}`);
        console.log(`   Role: ${user.role}`);

        await mongoose.connection.close();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateSampleUser();

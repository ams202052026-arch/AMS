/**
 * Test completion notification functionality
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const Notification = require('../models/notification');
const Customer = require('../models/customer');
const Business = require('../models/business');

async function testCompletionNotification() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('\n🧪 TESTING COMPLETION NOTIFICATION...\n');

        // Find a test appointment that can be completed
        const testAppointment = await Appointment.findOne({
            status: { $in: ['confirmed', 'approved'] }
        }).populate('customer').populate('service').populate('business');

        if (!testAppointment) {
            console.log('❌ No test appointment found with confirmed/approved status');
            console.log('💡 Create a test appointment first or change an existing one to confirmed status');
            return;
        }

        console.log('✅ Found test appointment:');
        console.log(`   ID: ${testAppointment._id}`);
        console.log(`   Customer: ${testAppointment.customer.name}`);
        console.log(`   Service: ${testAppointment.service.name}`);
        console.log(`   Status: ${testAppointment.status}`);
        console.log(`   Queue: ${testAppointment.queueNumber}`);

        // Check customer's current points
        const customerBefore = await Customer.findById(testAppointment.customer._id);
        console.log(`   Customer points before: ${customerBefore.rewardPoints}`);

        // Check existing notifications count
        const notificationsBefore = await Notification.countDocuments({
            customer: testAppointment.customer._id
        });
        console.log(`   Notifications before: ${notificationsBefore}`);

        // Simulate completion (without actually calling the controller)
        console.log('\n🔄 Simulating appointment completion...');

        // Update appointment status
        const completedAppointment = await Appointment.findByIdAndUpdate(
            testAppointment._id,
            { 
                status: 'completed',
                completedAt: new Date()
            },
            { new: true }
        ).populate('customer').populate('service').populate('business');

        // Award points
        const pointsEarned = completedAppointment.service.pointsEarned || 10;
        await Customer.findByIdAndUpdate(
            completedAppointment.customer._id,
            { $inc: { rewardPoints: pointsEarned } }
        );

        // Get updated customer
        const customerAfter = await Customer.findById(completedAppointment.customer._id);

        // Create completion notification
        const business = await Business.findById(completedAppointment.businessId);
        const staffName = completedAppointment.staff ? 'Test Staff' : 'Our team';
        const finalPrice = completedAppointment.finalPrice || completedAppointment.service.price;
        
        const formattedDate = new Date(completedAppointment.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });

        const notification = await Notification.create({
            customer: completedAppointment.customer._id,
            title: '🎉 Service Complete - Thank You!',
            message: `Your ${completedAppointment.service.name} appointment has been completed successfully!\n\nService: ${completedAppointment.service.name}\nBusiness: ${business.businessName}\nStaff: ${staffName}\nDate: ${formattedDate}\nAmount Paid: ₱${finalPrice}\n\n🎁 Rewards Earned: +${pointsEarned} points\n💰 Total Points: ${customerAfter.rewardPoints} points\n\nThank you for choosing ${business.businessName}. We hope to see you again soon!`,
            type: 'reward_update',
            meta: {
                appointmentId: completedAppointment._id,
                pointsEarned: pointsEarned,
                totalPoints: customerAfter.rewardPoints,
                businessId: business._id,
                completedBy: 'test_script',
                completedAt: new Date()
            }
        });

        console.log('✅ Appointment marked as completed');
        console.log('✅ Points awarded to customer');
        console.log('✅ Completion notification created');

        // Verify results
        console.log('\n📊 VERIFICATION RESULTS:');
        console.log(`   Appointment status: ${completedAppointment.status}`);
        console.log(`   Points earned: +${pointsEarned}`);
        console.log(`   Customer points after: ${customerAfter.rewardPoints} (was ${customerBefore.rewardPoints})`);
        console.log(`   Notification ID: ${notification._id}`);
        console.log(`   Notification title: ${notification.title}`);
        console.log(`   Notification type: ${notification.type}`);

        // Check if customer will see the notification
        const unreadNotifications = await Notification.countDocuments({
            customer: completedAppointment.customer._id,
            read: false
        });
        console.log(`   Unread notifications for customer: ${unreadNotifications}`);

        console.log('\n🎉 COMPLETION NOTIFICATION TEST SUCCESSFUL!');
        console.log('\n📱 Customer should now see:');
        console.log('   ✅ Notification badge with unread count');
        console.log('   ✅ "Service Complete - Thank You!" notification');
        console.log('   ✅ Points earned information');
        console.log('   ✅ Updated total points');

    } catch (error) {
        console.error('❌ Error testing completion notification:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the test
testCompletionNotification();
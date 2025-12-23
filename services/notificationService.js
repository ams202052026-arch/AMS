const Appointment = require('../models/appointment');
const User = require('../models/user');
const Notification = require('../models/notification');
const { Reward } = require('../models/reward');
const { formatTime12Hour } = require('../utils/timeFormat');

// Send 24-hour reminder for approved appointments
async function sendAppointmentReminders() {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

        // Find approved appointments for tomorrow
        const appointments = await Appointment.find({
            date: { $gte: tomorrow, $lt: dayAfterTomorrow },
            status: 'approved'
        }).populate('service').populate('staff').populate('customer');

        console.log(`📧 Sending reminders for ${appointments.length} appointments tomorrow`);

        for (const apt of appointments) {
            // Check if reminder already sent
            const existingReminder = await Notification.findOne({
                customer: apt.customer._id,
                type: 'appointment_reminder',
                'meta.appointmentId': apt._id
            });

            if (!existingReminder) {
                const staffName = apt.staff ? apt.staff.name : 'Our team';
                const customerName = `${apt.customer.firstName} ${apt.customer.lastName}`;
                
                await Notification.create({
                    customer: apt.customer._id,
                    title: 'Reminder: Appointment Tomorrow',
                    message: `Don't forget your appointment tomorrow!\n\nService: ${apt.service.name}\nDate: ${new Date(apt.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}\nTime: ${formatTime12Hour(apt.timeSlot.start)} - ${formatTime12Hour(apt.timeSlot.end)}\nStaff: ${staffName}\nQueue: ${apt.queueNumber}\n\nNeed to reschedule? Visit your appointments page.`,
                    type: 'appointment_reminder',
                    meta: {
                        appointmentId: apt._id,
                        queueNumber: apt.queueNumber
                    }
                });

                console.log(`  ✅ Reminder sent to ${customerName} for ${apt.queueNumber}`);
            }
        }

        console.log('✅ Reminder check complete\n');
    } catch (error) {
        console.error('❌ Error sending reminders:', error);
    }
}

// Check for points milestones and send notifications
async function checkPointsMilestones() {
    try {
        const customers = await User.find({ 
            role: 'customer',
            rewardPoints: { $gt: 0 } 
        });
        const rewards = await Reward.find({ isActive: true }).sort({ pointsRequired: 1 });

        console.log(`🎯 Checking points milestones for ${customers.length} customers`);

        for (const customer of customers) {
            // Find rewards customer can now afford
            const affordableRewards = rewards.filter(r => 
                r.pointsRequired <= customer.rewardPoints
            );

            if (affordableRewards.length > 0) {
                // Check if milestone notification already sent
                const lastMilestone = await Notification.findOne({
                    customer: customer._id,
                    type: 'reward_milestone'
                }).sort({ createdAt: -1 });

                // Only send if points increased since last milestone
                const shouldNotify = !lastMilestone || 
                    (lastMilestone.meta && lastMilestone.meta.pointsAtTime < customer.rewardPoints);

                if (shouldNotify && customer.rewardPoints >= 20) { // Minimum 20 points to notify
                    const rewardList = affordableRewards.slice(0, 3).map(r => 
                        `• ${r.name} (${r.pointsRequired} pts)`
                    ).join('\n');

                    const customerName = `${customer.firstName} ${customer.lastName}`;

                    await Notification.create({
                        customer: customer._id,
                        title: 'You\'ve Earned Enough Points!',
                        message: `Congratulations! You now have ${customer.rewardPoints} points.\n\nYou can redeem:\n${rewardList}\n\nView rewards to redeem now!`,
                        type: 'reward_milestone',
                        meta: {
                            pointsAtTime: customer.rewardPoints,
                            affordableRewardsCount: affordableRewards.length
                        }
                    });

                    console.log(`  ✅ Milestone notification sent to ${customerName} (${customer.rewardPoints} pts)`);
                }
            }
        }

        console.log('✅ Milestone check complete\n');
    } catch (error) {
        console.error('❌ Error checking milestones:', error);
    }
}

// Send "ready to serve" notification when appointment status changes to in-progress
async function sendReadyToServeNotification(appointmentId) {
    try {
        const appointment = await Appointment.findById(appointmentId)
            .populate('service')
            .populate('staff')
            .populate('customer');

        if (!appointment) return;

        const staffName = appointment.staff ? appointment.staff.name : 'Our team';

        await Notification.create({
            customer: appointment.customer._id,
            title: 'It\'s Your Turn Now!',
            message: `We're ready to serve you! Please come to the service area immediately.\n\nQueue Number: ${appointment.queueNumber}\nService: ${appointment.service.name}\nStaff: ${staffName}\n\nPlease proceed to ${staffName}'s station. We're excited to serve you!`,
            type: 'queue_update',
            meta: {
                appointmentId: appointment._id,
                queueNumber: appointment.queueNumber
            }
        });

        console.log(`✅ Ready-to-serve notification sent for ${appointment.queueNumber}`);
    } catch (error) {
        console.error('❌ Error sending ready notification:', error);
    }
}

module.exports = {
    sendAppointmentReminders,
    checkPointsMilestones,
    sendReadyToServeNotification
};

const cron = require('node-cron');
const { sendAppointmentReminders, checkPointsMilestones } = require('./notificationService');
const Appointment = require('../models/appointment');
const Notification = require('../models/notification');

async function autoCancelExpiredPendingAppointments() {
    try {
        const now = new Date();
        
        // Find all pending appointments where the appointment date/time has passed
        const expiredAppointments = await Appointment.find({
            status: 'pending',
            date: { $lt: now }
        }).populate('customer service');

        if (expiredAppointments.length > 0) {
            console.log(`Found ${expiredAppointments.length} expired pending appointments to cancel`);

            for (const appointment of expiredAppointments) {
                // Update appointment status to cancelled
                appointment.status = 'cancelled';
                appointment.notes = (appointment.notes || '') + '\n[Auto-cancelled: Not approved before appointment time]';
                await appointment.save();

                // Create notification for customer
                await Notification.create({
                    customer: appointment.customer._id,
                    type: 'appointment_cancelled',
                    title: 'Appointment Auto-Cancelled',
                    message: `Your appointment for ${appointment.service.name} on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot.start} was automatically cancelled because it was not approved by the admin before the scheduled time.\n\nQueue Number: ${appointment.queueNumber}\n\nPlease book a new appointment if you still need this service.`,
                    relatedAppointment: appointment._id
                });

                console.log(`Auto-cancelled appointment ${appointment.queueNumber}`);
            }

            console.log(`✅ Auto-cancelled ${expiredAppointments.length} expired pending appointments`);
        }
    } catch (error) {
        console.error('Error auto-cancelling expired appointments:', error);
    }
}

function startScheduler() {
    console.log('🕐 Starting notification scheduler...\n');

    // Run appointment reminders daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ Running daily appointment reminders...');
        await sendAppointmentReminders();
    });

    // Run points milestone check daily at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
        console.log('🎯 Checking points milestones...');
        await checkPointsMilestones();
    });

    // Run auto-cancel check every hour
    cron.schedule('0 * * * *', async () => {
        console.log('🚫 Checking for expired pending appointments...');
        await autoCancelExpiredPendingAppointments();
    });

    // Optional: Run on startup for testing (comment out in production)
    console.log('✅ Scheduler started successfully');
    console.log('   - Appointment reminders: Daily at 9:00 AM');
    console.log('   - Points milestones: Daily at 10:00 AM');
    console.log('   - Auto-cancel expired pending: Every hour\n');
}

module.exports = { startScheduler, autoCancelExpiredPendingAppointments };

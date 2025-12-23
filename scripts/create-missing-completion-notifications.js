/**
 * Create missing completion notifications for existing completed appointments
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('../models/notification');
const Appointment = require('../models/appointment');
const Customer = require('../models/customer');
const Service = require('../models/service');
const Business = require('../models/business');

async function createMissingCompletionNotifications() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('\n🔧 CREATING MISSING COMPLETION NOTIFICATIONS...\n');

        // Find completed appointments without notifications
        const completedAppointments = await Appointment.find({
            status: 'completed'
        });

        console.log(`📊 Found ${completedAppointments.length} completed appointments`);

        let notificationsCreated = 0;

        for (const appointment of completedAppointments) {
            // Check if notification already exists
            const existingNotification = await Notification.findOne({
                customer: appointment.customer,
                type: 'reward_update',
                'meta.appointmentId': appointment._id
            });

            if (existingNotification) {
                console.log(`✅ Notification already exists for appointment ${appointment.queueNumber}`);
                continue;
            }

            // Get related data
            const customer = await Customer.findById(appointment.customer);
            const service = await Service.findById(appointment.service);
            const business = await Business.findById(appointment.businessId);

            if (!customer || !service || !business) {
                console.log(`❌ Missing data for appointment ${appointment.queueNumber}`);
                continue;
            }

            // Create completion notification
            const pointsEarned = service.pointsEarned || 10;
            const finalPrice = appointment.finalPrice || service.price;
            
            const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });

            await Notification.create({
                customer: customer._id,
                title: '🎉 Service Complete - Thank You!',
                message: `Your ${service.name} appointment has been completed successfully!\n\nService: ${service.name}\nBusiness: ${business.businessName}\nDate: ${formattedDate}\nAmount Paid: ₱${finalPrice}\n\n🎁 Rewards Earned: +${pointsEarned} points\n\nThank you for choosing ${business.businessName}. We hope to see you again soon!`,
                type: 'reward_update',
                meta: {
                    appointmentId: appointment._id,
                    pointsEarned: pointsEarned,
                    businessId: business._id,
                    completedBy: 'system_backfill',
                    completedAt: appointment.completedAt || appointment.updatedAt
                },
                createdAt: appointment.completedAt || appointment.updatedAt,
                updatedAt: appointment.completedAt || appointment.updatedAt
            });

            console.log(`✅ Created notification for appointment ${appointment.queueNumber} (${customer.name})`);
            notificationsCreated++;
        }

        console.log(`\n📊 SUMMARY:`);
        console.log(`   ✅ Notifications created: ${notificationsCreated}`);
        console.log(`   📱 Customers will now see completion notifications`);

        if (notificationsCreated > 0) {
            console.log('\n🎉 SUCCESS! Missing completion notifications have been created.');
            console.log('   Customers can now see their completion notifications in the app.');
        } else {
            console.log('\n✅ All completion notifications are already present.');
        }

    } catch (error) {
        console.error('❌ Error creating notifications:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the script
createMissingCompletionNotifications();
/**
 * Verify that completion notifications are working
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('../models/notification');
const Appointment = require('../models/appointment');
const Customer = require('../models/customer');
const Service = require('../models/service');

async function verifyCompletionNotifications() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('\n🔍 VERIFYING COMPLETION NOTIFICATIONS...\n');

        // Find completed appointments
        const completedAppointments = await Appointment.find({
            status: 'completed'
        }).populate('customer').populate('service');

        console.log(`📊 Found ${completedAppointments.length} completed appointments`);

        if (completedAppointments.length === 0) {
            console.log('💡 No completed appointments found. Complete an appointment first to test notifications.');
            return;
        }

        // Check each completed appointment for corresponding notification
        let notificationsFound = 0;
        let missingNotifications = 0;

        for (const appointment of completedAppointments) {
            const notification = await Notification.findOne({
                customer: appointment.customer._id,
                type: 'reward_update',
                'meta.appointmentId': appointment._id
            });

            if (notification) {
                notificationsFound++;
                console.log(`✅ Appointment ${appointment.queueNumber}: Notification found`);
                console.log(`   Customer: ${appointment.customer.name}`);
                console.log(`   Service: ${appointment.service.name}`);
                console.log(`   Notification: "${notification.title}"`);
                console.log(`   Created: ${notification.createdAt}`);
                console.log(`   Read: ${notification.read ? 'Yes' : 'No'}`);
            } else {
                missingNotifications++;
                console.log(`❌ Appointment ${appointment.queueNumber}: No notification found`);
                console.log(`   Customer: ${appointment.customer.name}`);
                console.log(`   Service: ${appointment.service.name}`);
                console.log(`   Completed: ${appointment.completedAt}`);
            }
            console.log('');
        }

        // Summary
        console.log('📋 SUMMARY:');
        console.log(`   ✅ Notifications found: ${notificationsFound}`);
        console.log(`   ❌ Missing notifications: ${missingNotifications}`);
        console.log(`   📊 Success rate: ${Math.round((notificationsFound / completedAppointments.length) * 100)}%`);

        // Check recent completion notifications
        const recentNotifications = await Notification.find({
            type: 'reward_update',
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        }).populate('customer').sort({ createdAt: -1 });

        console.log(`\n🕐 Recent completion notifications (last 24h): ${recentNotifications.length}`);
        
        recentNotifications.forEach((notif, index) => {
            console.log(`${index + 1}. ${notif.customer.name} - "${notif.title}" (${notif.read ? 'read' : 'unread'})`);
        });

        // Check for customers with unread completion notifications
        const unreadCompletions = await Notification.find({
            type: 'reward_update',
            read: false
        }).populate('customer');

        console.log(`\n🔔 Customers with unread completion notifications: ${unreadCompletions.length}`);
        
        unreadCompletions.forEach((notif, index) => {
            console.log(`${index + 1}. ${notif.customer.name} - ${notif.createdAt.toLocaleDateString()}`);
        });

        if (notificationsFound > 0) {
            console.log('\n✅ COMPLETION NOTIFICATIONS ARE WORKING!');
            console.log('   Customers are receiving notifications when appointments are completed.');
        } else {
            console.log('\n⚠️ NO COMPLETION NOTIFICATIONS FOUND');
            console.log('   This might indicate an issue with the notification system.');
        }

    } catch (error) {
        console.error('❌ Error verifying notifications:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the verification
verifyCompletionNotifications();
/**
 * Analyze and identify notification system issues
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('../models/notification');
const Appointment = require('../models/appointment');
const User = require('../models/user');

async function analyzeNotificationIssues() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('\n🔍 ANALYZING NOTIFICATION ISSUES...\n');

        // 1. Check for notifications with wrong data
        console.log('1. CHECKING NOTIFICATION DATA ACCURACY...');
        const notifications = await Notification.find({}).populate('customer');
        
        console.log(`   Found ${notifications.length} total notifications`);
        
        let issuesFound = 0;

        for (const notif of notifications) {
            const issues = [];

            // Check if customer exists
            if (!notif.customer) {
                issues.push('❌ Customer not found/populated');
            }

            // Check message content for common issues
            if (notif.message) {
                // Check for undefined values in message
                if (notif.message.includes('undefined')) {
                    issues.push('❌ Message contains "undefined"');
                }
                
                // Check for null values
                if (notif.message.includes('null')) {
                    issues.push('❌ Message contains "null"');
                }

                // Check for empty time slots
                if (notif.message.includes(' - ') && notif.message.includes('Time:  - ')) {
                    issues.push('❌ Empty time slot in message');
                }

                // Check for invalid dates
                if (notif.message.includes('Invalid Date')) {
                    issues.push('❌ Invalid date in message');
                }
            }

            // Check appointment-related notifications
            if (notif.type.includes('appointment') && notif.meta && notif.meta.appointmentId) {
                const appointment = await Appointment.findById(notif.meta.appointmentId)
                    .populate('service')
                    .populate('staff');

                if (!appointment) {
                    issues.push('❌ Referenced appointment not found');
                } else {
                    // Check if notification data matches appointment data
                    if (notif.message.includes('Queue:') && !notif.message.includes(appointment.queueNumber)) {
                        issues.push('❌ Queue number mismatch');
                    }
                }
            }

            if (issues.length > 0) {
                issuesFound++;
                console.log(`\n   📋 Notification ID: ${notif._id}`);
                console.log(`   📅 Created: ${notif.createdAt}`);
                console.log(`   📝 Type: ${notif.type}`);
                console.log(`   👤 Customer: ${notif.customer ? notif.customer.email : 'NOT FOUND'}`);
                console.log(`   🔴 Issues:`);
                issues.forEach(issue => console.log(`      ${issue}`));
                
                if (notif.message && notif.message.length < 200) {
                    console.log(`   💬 Message: "${notif.message}"`);
                }
            }
        }

        console.log(`\n   📊 SUMMARY: ${issuesFound} notifications with issues found\n`);

        // 2. Check for timing issues
        console.log('2. CHECKING TIMING ISSUES...');
        
        const reminderNotifs = await Notification.find({ type: 'appointment_reminder' });
        console.log(`   Found ${reminderNotifs.length} reminder notifications`);

        let timingIssues = 0;
        for (const reminder of reminderNotifs) {
            if (reminder.meta && reminder.meta.appointmentId) {
                const appointment = await Appointment.findById(reminder.meta.appointmentId);
                if (appointment) {
                    const appointmentDate = new Date(appointment.date);
                    const reminderDate = new Date(reminder.createdAt);
                    const hoursDiff = (appointmentDate - reminderDate) / (1000 * 60 * 60);

                    // Should be sent ~24 hours before
                    if (hoursDiff < 20 || hoursDiff > 28) {
                        timingIssues++;
                        console.log(`   ⏰ Timing issue: Reminder sent ${hoursDiff.toFixed(1)} hours before appointment`);
                        console.log(`      Appointment: ${appointmentDate.toISOString()}`);
                        console.log(`      Reminder: ${reminderDate.toISOString()}`);
                    }
                }
            }
        }

        console.log(`   📊 TIMING ISSUES: ${timingIssues} reminders with wrong timing\n`);

        // 3. Check for duplicate notifications
        console.log('3. CHECKING FOR DUPLICATES...');
        
        const duplicateGroups = await Notification.aggregate([
            {
                $group: {
                    _id: {
                        customer: '$customer',
                        type: '$type',
                        'meta.appointmentId': '$meta.appointmentId'
                    },
                    count: { $sum: 1 },
                    notifications: { $push: '$_id' }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]);

        console.log(`   Found ${duplicateGroups.length} groups of duplicate notifications`);
        
        let totalDuplicates = 0;
        for (const group of duplicateGroups) {
            totalDuplicates += group.count - 1; // -1 because one is the original
            console.log(`   🔄 ${group.count} duplicates for customer ${group._id.customer}, type: ${group._id.type}`);
        }

        console.log(`   📊 DUPLICATES: ${totalDuplicates} duplicate notifications found\n`);

        // 4. Check for missing notifications
        console.log('4. CHECKING FOR MISSING NOTIFICATIONS...');
        
        const completedAppointments = await Appointment.find({ 
            status: 'completed' 
        }).populate('customer');

        let missingCompletionNotifs = 0;
        for (const apt of completedAppointments) {
            const completionNotif = await Notification.findOne({
                customer: apt.customer._id,
                type: 'reward_update',
                'meta.appointmentId': apt._id
            });

            if (!completionNotif) {
                missingCompletionNotifs++;
            }
        }

        console.log(`   📊 MISSING: ${missingCompletionNotifs} completion notifications missing\n`);

        // 5. Overall summary
        console.log('📋 OVERALL ISSUES SUMMARY:');
        console.log(`   🔴 Data Issues: ${issuesFound} notifications`);
        console.log(`   ⏰ Timing Issues: ${timingIssues} reminders`);
        console.log(`   🔄 Duplicates: ${totalDuplicates} notifications`);
        console.log(`   ❌ Missing: ${missingCompletionNotifs} completion notifications`);
        
        const totalIssues = issuesFound + timingIssues + totalDuplicates + missingCompletionNotifs;
        console.log(`   📊 TOTAL ISSUES: ${totalIssues}`);

        if (totalIssues > 0) {
            console.log('\n🚨 RECOMMENDATION: Run notification cleanup and fix script');
        } else {
            console.log('\n✅ No major issues found in notification system');
        }

    } catch (error) {
        console.error('❌ Error analyzing notifications:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the analysis
analyzeNotificationIssues();
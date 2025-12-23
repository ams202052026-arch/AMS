/**
 * Fix notification system issues
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('../models/notification');
const Appointment = require('../models/appointment');
const User = require('../models/user');

async function fixNotificationIssues() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('\n🔧 FIXING NOTIFICATION ISSUES...\n');

        // 1. Remove notifications with missing appointments
        console.log('1. CLEANING UP ORPHANED NOTIFICATIONS...');
        
        const appointmentNotifs = await Notification.find({
            type: { $in: ['appointment_confirm', 'appointment_reminder', 'appointment_update', 'appointment_cancelled'] },
            'meta.appointmentId': { $exists: true }
        });

        let orphanedCount = 0;
        for (const notif of appointmentNotifs) {
            if (notif.meta && notif.meta.appointmentId) {
                const appointment = await Appointment.findById(notif.meta.appointmentId);
                if (!appointment) {
                    console.log(`   🗑️ Removing orphaned notification: ${notif.title} (${notif._id})`);
                    await Notification.findByIdAndDelete(notif._id);
                    orphanedCount++;
                }
            }
        }

        console.log(`   ✅ Removed ${orphanedCount} orphaned notifications\n`);

        // 2. Fix notifications with undefined/null values
        console.log('2. FIXING MALFORMED NOTIFICATIONS...');
        
        const malformedNotifs = await Notification.find({
            $or: [
                { message: /undefined/ },
                { message: /null/ },
                { message: /Invalid Date/ },
                { title: /undefined/ },
                { title: /null/ }
            ]
        });

        console.log(`   Found ${malformedNotifs.length} malformed notifications`);
        
        for (const notif of malformedNotifs) {
            console.log(`   🔧 Fixing notification: ${notif._id}`);
            
            // Fix common issues
            let fixedMessage = notif.message
                .replace(/undefined/g, 'N/A')
                .replace(/null/g, 'N/A')
                .replace(/Invalid Date/g, 'Date TBD')
                .replace(/Time:  - /g, 'Time: TBD')
                .replace(/Staff: null/g, 'Staff: Any Available')
                .replace(/Staff: undefined/g, 'Staff: Any Available');

            let fixedTitle = notif.title
                .replace(/undefined/g, 'Notification')
                .replace(/null/g, 'Notification');

            await Notification.findByIdAndUpdate(notif._id, {
                message: fixedMessage,
                title: fixedTitle
            });
        }

        console.log(`   ✅ Fixed ${malformedNotifs.length} malformed notifications\n`);

        // 3. Remove duplicate notifications (simple approach)
        console.log('3. REMOVING DUPLICATE NOTIFICATIONS...');
        
        const allNotifs = await Notification.find({}).sort({ createdAt: -1 });
        const seen = new Set();
        let duplicatesRemoved = 0;

        for (const notif of allNotifs) {
            const key = `${notif.customer}-${notif.type}-${notif.title}-${notif.message.substring(0, 50)}`;
            
            if (seen.has(key)) {
                console.log(`   🗑️ Removing duplicate: ${notif.title} (${notif._id})`);
                await Notification.findByIdAndDelete(notif._id);
                duplicatesRemoved++;
            } else {
                seen.add(key);
            }
        }

        console.log(`   ✅ Removed ${duplicatesRemoved} duplicate notifications\n`);

        // 4. Create missing completion notifications for completed appointments
        console.log('4. CREATING MISSING COMPLETION NOTIFICATIONS...');
        
        const completedAppointments = await Appointment.find({ 
            status: 'completed' 
        }).populate('customer').populate('service').populate('staff');

        let missingNotifs = 0;
        for (const apt of completedAppointments) {
            const existingNotif = await Notification.findOne({
                customer: apt.customer._id,
                type: 'reward_update',
                'meta.appointmentId': apt._id
            });

            if (!existingNotif) {
                const staffName = apt.staff ? apt.staff.name : 'Our team';
                const pointsEarned = apt.service.pointsEarned || 10;
                
                await Notification.create({
                    customer: apt.customer._id,
                    title: '🎉 Service Complete - Thank You!',
                    message: `Your ${apt.service.name} appointment has been completed successfully!\n\nService: ${apt.service.name}\nStaff: ${staffName}\nDate: ${new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\n\n🎁 Rewards Earned: +${pointsEarned} points\n\nThank you for choosing our service. We hope to see you again soon!`,
                    type: 'reward_update',
                    meta: {
                        appointmentId: apt._id,
                        pointsEarned: pointsEarned
                    }
                });

                console.log(`   ✅ Created completion notification for appointment ${apt.queueNumber}`);
                missingNotifs++;
            }
        }

        console.log(`   ✅ Created ${missingNotifs} missing completion notifications\n`);

        // 5. Update notification timestamps for better organization
        console.log('5. ORGANIZING NOTIFICATION TIMESTAMPS...');
        
        const recentNotifs = await Notification.find({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        }).sort({ createdAt: 1 });

        console.log(`   Found ${recentNotifs.length} recent notifications - timestamps look good\n`);

        // 6. Final verification
        console.log('6. FINAL VERIFICATION...');
        
        const totalNotifs = await Notification.countDocuments();
        const unreadNotifs = await Notification.countDocuments({ read: false });
        const recentNotifs2 = await Notification.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        console.log(`   📊 Total notifications: ${totalNotifs}`);
        console.log(`   📊 Unread notifications: ${unreadNotifs}`);
        console.log(`   📊 Recent notifications (24h): ${recentNotifs2}`);

        console.log('\n✅ NOTIFICATION SYSTEM CLEANUP COMPLETE!');
        console.log('\n📋 SUMMARY OF FIXES:');
        console.log(`   🗑️ Removed ${orphanedCount} orphaned notifications`);
        console.log(`   🔧 Fixed ${malformedNotifs.length} malformed notifications`);
        console.log(`   🗑️ Removed ${duplicatesRemoved} duplicate notifications`);
        console.log(`   ✅ Created ${missingNotifs} missing completion notifications`);

    } catch (error) {
        console.error('❌ Error fixing notifications:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the fix
fixNotificationIssues();
/**
 * Test script to create sample notifications for testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('../models/notification');
const User = require('../models/user');

async function createTestNotifications() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find a test user (customer)
        const testUser = await User.findOne({ 
            email: 'alphi.fidelino@lspu.edu.ph',
            role: 'customer' 
        });

        if (!testUser) {
            console.log('❌ Test user not found');
            return;
        }

        console.log('✅ Found test user:', testUser.email);

        // Clear existing notifications for this user
        await Notification.deleteMany({ customer: testUser._id });
        console.log('🧹 Cleared existing notifications');

        // Create sample notifications
        const sampleNotifications = [
            {
                customer: testUser._id,
                title: 'Welcome to AMS!',
                message: 'Thank you for joining our Appointment Management System. You can now book services from various businesses.',
                type: 'business_approved',
                read: false
            },
            {
                customer: testUser._id,
                title: 'Appointment Confirmed',
                message: 'Your appointment for Hair Cut service has been confirmed for tomorrow at 2:00 PM.',
                type: 'appointment_confirm',
                read: false
            },
            {
                customer: testUser._id,
                title: 'Appointment Reminder',
                message: 'Don\'t forget! You have an appointment tomorrow at 2:00 PM for Hair Cut service.',
                type: 'appointment_reminder',
                read: false
            },
            {
                customer: testUser._id,
                title: 'Reward Points Earned',
                message: 'Congratulations! You earned 50 points for completing your Hair Cut appointment. Total points: 150',
                type: 'reward_update',
                read: true
            },
            {
                customer: testUser._id,
                title: 'Milestone Reached!',
                message: 'Amazing! You\'ve reached 150 points. You can now redeem rewards from our catalog.',
                type: 'reward_milestone',
                read: false
            }
        ];

        // Insert notifications
        const createdNotifications = await Notification.insertMany(sampleNotifications);
        console.log(`✅ Created ${createdNotifications.length} test notifications`);

        // Display summary
        const unreadCount = await Notification.countDocuments({ 
            customer: testUser._id, 
            read: false 
        });
        console.log(`📊 Unread notifications: ${unreadCount}`);

        console.log('\n🎉 Test notifications created successfully!');
        console.log('You can now test the notification system by:');
        console.log('1. Logging in as alphi.fidelino@lspu.edu.ph');
        console.log('2. Clicking the notification icon in the header');
        console.log('3. Visiting /notifications page');

    } catch (error) {
        console.error('❌ Error creating test notifications:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the script
createTestNotifications();
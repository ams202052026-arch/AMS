/**
 * Test notification API endpoints directly
 */

const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
require('dotenv').config();

// Import controllers and models
const notificationsController = require('../controllers/notifications');
const User = require('../models/user');

async function testNotificationEndpoints() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find test user
        const testUser = await User.findOne({ 
            email: 'alphi.fidelino@lspu.edu.ph',
            role: 'customer' 
        });

        if (!testUser) {
            console.log('❌ Test user not found');
            return;
        }

        console.log('✅ Found test user:', testUser.email);

        // Create mock request and response objects
        const mockReq = {
            session: {
                userId: testUser._id,
                userEmail: testUser.email,
                userName: testUser.fullName,
                userRole: testUser.role,
                currentMode: 'customer'
            }
        };

        const mockRes = {
            json: (data) => {
                console.log('📤 Response:', JSON.stringify(data, null, 2));
                return mockRes;
            },
            status: (code) => {
                console.log('📊 Status Code:', code);
                return mockRes;
            }
        };

        console.log('\n🧪 Testing getNotifications...');
        await notificationsController.getNotifications(mockReq, mockRes);

        console.log('\n🧪 Testing getUnreadCount...');
        await notificationsController.getUnreadCount(mockReq, mockRes);

        console.log('\n✅ Direct controller test completed!');

    } catch (error) {
        console.error('❌ Error testing endpoints:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the test
testNotificationEndpoints();
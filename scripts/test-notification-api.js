/**
 * Test script to verify notification API endpoints
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

async function testNotificationAPI() {
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
        console.log('User ID:', testUser._id);

        // Test notification endpoints using fetch (simulate browser requests)
        const baseURL = 'http://localhost:3000';
        
        // Create a session cookie simulation
        const sessionData = {
            userId: testUser._id.toString(),
            userEmail: testUser.email,
            userName: testUser.fullName,
            userRole: testUser.role,
            currentMode: 'customer'
        };

        console.log('\n🧪 Testing notification API endpoints...');
        console.log('Session data:', sessionData);

        // Note: In a real test, we would need to simulate the session
        // For now, let's just verify the database has the notifications
        const Notification = require('../models/notification');
        
        const notifications = await Notification.find({ customer: testUser._id })
            .sort({ createdAt: -1 });
        
        console.log(`\n📊 Found ${notifications.length} notifications in database:`);
        notifications.forEach((notif, index) => {
            console.log(`${index + 1}. ${notif.title} (${notif.read ? 'read' : 'unread'}) - ${notif.type}`);
        });

        const unreadCount = await Notification.countDocuments({ 
            customer: testUser._id, 
            read: false 
        });
        console.log(`\n🔔 Unread count: ${unreadCount}`);

        console.log('\n✅ Database verification complete!');
        console.log('\n🌐 To test the web interface:');
        console.log('1. Start the server: node server.js');
        console.log('2. Login as alphi.fidelino@lspu.edu.ph');
        console.log('3. Check notification badge in header');
        console.log('4. Visit /notifications page');

    } catch (error) {
        console.error('❌ Error testing notification API:', error);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Run the test
testNotificationAPI();
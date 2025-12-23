require('dotenv').config();
const mongoose = require('mongoose');
const Notification = require('../models/notification');

async function checkNotifications() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to database\n');

        const notifications = await Notification.find()
            .populate('customer')
            .sort({ createdAt: -1 })
            .limit(10);

        console.log(`📧 Found ${notifications.length} notifications:\n`);

        notifications.forEach((notif, index) => {
            console.log(`${index + 1}. ${notif.title}`);
            console.log(`   Type: ${notif.type}`);
            console.log(`   Customer: ${notif.customer ? notif.customer.name : 'Unknown'}`);
            console.log(`   Read: ${notif.read ? 'Yes' : 'No'}`);
            console.log(`   Created: ${notif.createdAt}`);
            console.log(`   Message: ${notif.message.substring(0, 100)}...`);
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkNotifications();

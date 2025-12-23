const mongoose = require('mongoose');
const User = require('../models/user');
const Business = require('../models/business');
require('dotenv').config();

async function listAllUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        const users = await User.find({});
        
        console.log('=== ALL USERS IN DATABASE ===\n');
        
        for (const user of users) {
            const business = await Business.findOne({ ownerId: user._id });
            
            console.log(`📧 ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   Name: ${user.fullName}`);
            console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}${user.isBanned ? ' (BANNED)' : ''}`);
            
            if (business) {
                console.log(`   🏢 Business: ${business.businessName}`);
                console.log(`   Status: ${business.verificationStatus}`);
            }
            
            console.log('');
        }
        
        console.log(`Total Users: ${users.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

listAllUsers();

const mongoose = require('mongoose');
const User = require('../models/user');
const Business = require('../models/business');
const Appointment = require('../models/appointment');
require('dotenv').config();

async function deleteTestUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // Keep these users (production users)
        const keepEmails = [
            'ams202052026@gmail.com',            // Super Admin
            'alphi.fidelino@lspu.edu.ph'         // Real customer with business
        ];
        
        console.log('🔍 Finding test users to delete...\n');
        
        // Find all users except the ones to keep
        const testUsers = await User.find({
            email: { $nin: keepEmails }
        });
        
        console.log(`Found ${testUsers.length} test users:\n`);
        
        testUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (${user.role})`);
        });
        
        if (testUsers.length === 0) {
            console.log('\n✅ No test users to delete!');
            process.exit(0);
        }
        
        console.log('\n⚠️  WARNING: This will delete these users and their data!');
        console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
        
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('🗑️  Deleting test users...\n');
        
        for (const user of testUsers) {
            // Delete user's business if they have one
            const business = await Business.findOne({ ownerId: user._id });
            if (business) {
                console.log(`  - Deleting business: ${business.businessName}`);
                await Business.deleteOne({ _id: business._id });
            }
            
            // Delete user's appointments
            const appointmentCount = await Appointment.countDocuments({ customer: user._id });
            if (appointmentCount > 0) {
                console.log(`  - Deleting ${appointmentCount} appointments`);
                await Appointment.deleteMany({ customer: user._id });
            }
            
            // Delete user
            console.log(`  - Deleting user: ${user.email}`);
            await User.deleteOne({ _id: user._id });
            console.log('');
        }
        
        console.log('✅ Test users deleted successfully!\n');
        
        // Show remaining users
        const remainingUsers = await User.find({});
        console.log('📋 Remaining users:');
        remainingUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email} (${user.role})`);
        });
        
        console.log('\n✨ Database cleaned!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

deleteTestUsers();

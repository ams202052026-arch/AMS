const mongoose = require('mongoose');
const { Reward, Redemption } = require('../models/reward');
const User = require('../models/user');
const Notification = require('../models/notification');

async function testRedemptionProcess() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        // Get test user
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        if (!testUser) {
            console.log('Test user not found');
            return;
        }

        console.log(`\n=== TESTING REDEMPTION PROCESS ===`);
        console.log(`User: ${testUser.fullName}`);
        console.log(`Current points: ${testUser.rewardPoints}`);

        // Get the cheapest reward for testing
        const cheapestReward = await Reward.findOne({ isActive: true }).sort({ pointsRequired: 1 });
        
        if (!cheapestReward) {
            console.log('No active rewards found');
            return;
        }

        console.log(`\nTesting redemption of: ${cheapestReward.name}`);
        console.log(`Points required: ${cheapestReward.pointsRequired}`);

        if (testUser.rewardPoints < cheapestReward.pointsRequired) {
            console.log('❌ Insufficient points for redemption');
            return;
        }

        // Simulate the redemption process
        console.log('\n--- Simulating Redemption Process ---');
        
        const pointsBefore = testUser.rewardPoints;
        console.log(`1. Points before redemption: ${pointsBefore}`);

        // Deduct points
        testUser.rewardPoints -= cheapestReward.pointsRequired;
        await testUser.save();
        console.log(`2. Points deducted: ${cheapestReward.pointsRequired}`);
        console.log(`3. Points after redemption: ${testUser.rewardPoints}`);

        // Create redemption record
        const redemption = new Redemption({
            customer: testUser._id,
            reward: cheapestReward._id,
            pointsUsed: cheapestReward.pointsRequired
        });
        await redemption.save();
        console.log(`4. ✓ Redemption record created with ID: ${redemption._id}`);

        // Create notification
        const notification = await Notification.create({
            customer: testUser._id,
            title: 'Reward Redeemed',
            message: `You have redeemed "${cheapestReward.name}" for ${cheapestReward.pointsRequired} points.`,
            type: 'reward_update'
        });
        console.log(`5. ✓ Notification created with ID: ${notification._id}`);

        // Verify the redemption was saved correctly
        const savedRedemption = await Redemption.findById(redemption._id)
            .populate('reward')
            .populate('customer');
        
        console.log('\n--- Verification ---');
        console.log(`✓ Redemption saved: ${savedRedemption.reward.name}`);
        console.log(`✓ Customer: ${savedRedemption.customer.fullName}`);
        console.log(`✓ Points used: ${savedRedemption.pointsUsed}`);
        console.log(`✓ Status: ${savedRedemption.status}`);
        console.log(`✓ Redeemed at: ${savedRedemption.redeemedAt}`);

        // Check user's updated points
        const updatedUser = await User.findById(testUser._id);
        console.log(`✓ User's current points: ${updatedUser.rewardPoints}`);

        // Check recent notifications
        const recentNotifications = await Notification.find({ 
            customer: testUser._id 
        }).sort({ createdAt: -1 }).limit(3);
        
        console.log(`\n--- Recent Notifications (${recentNotifications.length}) ---`);
        recentNotifications.forEach((notif, index) => {
            console.log(`${index + 1}. ${notif.title}: ${notif.message}`);
        });

        console.log('\n🎉 REDEMPTION TEST COMPLETED SUCCESSFULLY!');
        
    } catch (error) {
        console.error('Error testing redemption process:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

testRedemptionProcess();
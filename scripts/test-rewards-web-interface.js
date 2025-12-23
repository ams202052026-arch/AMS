const mongoose = require('mongoose');
const { Reward, Redemption } = require('../models/reward');
const User = require('../models/user');

async function testRewardsWebInterface() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        // Simulate the rewards controller logic
        console.log('\n=== TESTING REWARDS PAGE DATA ===');
        
        const userId = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' }).select('_id');
        if (!userId) {
            console.log('Test user not found');
            return;
        }

        const user = await User.findById(userId._id);
        const availableRewards = await Reward.find({ isActive: true });
        const myRedemptions = await Redemption.find({ 
            customer: userId._id 
        }).populate('reward').sort({ redeemedAt: -1 });

        console.log(`User: ${user.fullName}`);
        console.log(`Current Points: ${user.rewardPoints}`);
        console.log(`Available Rewards: ${availableRewards.length}`);
        console.log(`My Redemptions: ${myRedemptions.length}`);

        console.log('\n--- Available Rewards ---');
        availableRewards.forEach((reward, index) => {
            const canRedeem = user.rewardPoints >= reward.pointsRequired;
            const status = canRedeem ? '✅ Can Redeem' : `❌ Need ${reward.pointsRequired - user.rewardPoints} more points`;
            
            console.log(`${index + 1}. ${reward.name}`);
            console.log(`   Description: ${reward.description}`);
            console.log(`   Points Required: ${reward.pointsRequired}`);
            console.log(`   Type: ${reward.type} (${reward.discountType}: ${reward.discountValue}${reward.discountType === 'percentage' ? '%' : '₱'})`);
            console.log(`   Status: ${status}`);
            console.log('');
        });

        console.log('--- My Redemptions ---');
        if (myRedemptions.length === 0) {
            console.log('No redemptions found');
        } else {
            myRedemptions.forEach((redemption, index) => {
                console.log(`${index + 1}. ${redemption.reward.name}`);
                console.log(`   Points Used: ${redemption.pointsUsed}`);
                console.log(`   Status: ${redemption.status.toUpperCase()}`);
                console.log(`   Redeemed: ${new Date(redemption.redeemedAt).toLocaleDateString()}`);
                console.log('');
            });
        }

        // Test redemption eligibility
        console.log('--- Redemption Eligibility Test ---');
        const eligibleRewards = availableRewards.filter(reward => user.rewardPoints >= reward.pointsRequired);
        const ineligibleRewards = availableRewards.filter(reward => user.rewardPoints < reward.pointsRequired);
        
        console.log(`✅ Eligible for ${eligibleRewards.length} rewards:`);
        eligibleRewards.forEach(reward => {
            console.log(`   - ${reward.name} (${reward.pointsRequired} points)`);
        });
        
        console.log(`❌ Not eligible for ${ineligibleRewards.length} rewards:`);
        ineligibleRewards.forEach(reward => {
            console.log(`   - ${reward.name} (need ${reward.pointsRequired - user.rewardPoints} more points)`);
        });

        console.log('\n🎯 REWARDS WEB INTERFACE TEST COMPLETED!');
        console.log('The rewards page should display all this data correctly.');
        
    } catch (error) {
        console.error('Error testing rewards web interface:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

testRewardsWebInterface();
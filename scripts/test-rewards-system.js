const mongoose = require('mongoose');
const { Reward, Redemption } = require('../models/reward');
const User = require('../models/user');

async function testRewardsSystem() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        // Check existing rewards
        console.log('\n=== CHECKING EXISTING REWARDS ===');
        const rewards = await Reward.find({});
        console.log(`Found ${rewards.length} rewards in system:`);
        
        if (rewards.length === 0) {
            console.log('No rewards found. Creating sample rewards...');
            
            // Create sample rewards
            const sampleRewards = [
                {
                    name: '10% Service Discount',
                    description: 'Get 10% off your next service appointment',
                    pointsRequired: 100,
                    type: 'discount',
                    discountValue: 10,
                    discountType: 'percentage',
                    isActive: true
                },
                {
                    name: '₱50 Service Discount',
                    description: 'Get ₱50 off your next service appointment',
                    pointsRequired: 200,
                    type: 'discount',
                    discountValue: 50,
                    discountType: 'fixed',
                    isActive: true
                },
                {
                    name: '20% Service Discount',
                    description: 'Get 20% off your next service appointment',
                    pointsRequired: 300,
                    type: 'discount',
                    discountValue: 20,
                    discountType: 'percentage',
                    isActive: true
                }
            ];
            
            for (const rewardData of sampleRewards) {
                const reward = new Reward(rewardData);
                await reward.save();
                console.log(`✓ Created reward: ${reward.name} (${reward.pointsRequired} points)`);
            }
            
            // Refresh rewards list
            const newRewards = await Reward.find({});
            console.log(`\nNow have ${newRewards.length} rewards in system`);
        } else {
            rewards.forEach(reward => {
                console.log(`- ${reward.name}: ${reward.pointsRequired} points (${reward.isActive ? 'Active' : 'Inactive'})`);
            });
        }

        // Check test user points
        console.log('\n=== CHECKING TEST USER POINTS ===');
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        
        if (testUser) {
            console.log(`Test user: ${testUser.fullName}`);
            console.log(`Current points: ${testUser.rewardPoints}`);
            
            // If user has low points, add some for testing
            if (testUser.rewardPoints < 500) {
                console.log('Adding points for testing...');
                testUser.rewardPoints = 500;
                await testUser.save();
                console.log(`✓ Updated points to: ${testUser.rewardPoints}`);
            }
        } else {
            console.log('Test user not found');
        }

        // Check existing redemptions
        console.log('\n=== CHECKING EXISTING REDEMPTIONS ===');
        const redemptions = await Redemption.find({}).populate('reward').populate('customer');
        console.log(`Found ${redemptions.length} redemptions:`);
        
        redemptions.forEach(redemption => {
            console.log(`- ${redemption.customer?.fullName || 'Unknown'}: ${redemption.reward?.name || 'Unknown'} (${redemption.pointsUsed} points, ${redemption.status})`);
        });

        // Test redemption process (simulate)
        console.log('\n=== TESTING REDEMPTION LOGIC ===');
        const activeRewards = await Reward.find({ isActive: true });
        
        if (activeRewards.length > 0 && testUser) {
            const testReward = activeRewards[0];
            console.log(`Testing redemption of: ${testReward.name} (${testReward.pointsRequired} points)`);
            
            if (testUser.rewardPoints >= testReward.pointsRequired) {
                console.log('✓ User has sufficient points');
                console.log(`Points before: ${testUser.rewardPoints}`);
                console.log(`Points after redemption would be: ${testUser.rewardPoints - testReward.pointsRequired}`);
                console.log('Redemption logic test: PASSED');
            } else {
                console.log('✗ User has insufficient points');
                console.log('Redemption logic test: FAILED (insufficient points)');
            }
        }

        console.log('\n=== REWARDS SYSTEM TEST COMPLETE ===');
        
    } catch (error) {
        console.error('Error testing rewards system:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

testRewardsSystem();
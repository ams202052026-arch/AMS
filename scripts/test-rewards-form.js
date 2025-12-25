const mongoose = require('mongoose');
require('dotenv').config();

async function testRewardsForm() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        const { Reward } = require('../models/reward');
        
        // Test finding a reward
        const reward = await Reward.findOne();
        
        if (reward) {
            console.log('✓ Found reward:', reward._id);
            console.log('  Name:', reward.name);
            console.log('  Points:', reward.pointsRequired);
            console.log('  Discount:', reward.discountValue, reward.discountType);
            console.log('  Active:', reward.isActive);
        } else {
            console.log('⚠ No rewards found in database');
        }

        await mongoose.connection.close();
        console.log('\n✓ Test complete');
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

testRewardsForm();

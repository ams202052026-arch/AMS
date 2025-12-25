const mongoose = require('mongoose');
require('dotenv').config();

const { Reward } = require('../models/reward');

async function testRewardsActions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all rewards
        const rewards = await Reward.find();
        console.log('📋 Available Rewards:');
        console.log('='.repeat(80));
        
        rewards.forEach((reward, index) => {
            console.log(`${index + 1}. ${reward.name}`);
            console.log(`   ID: ${reward._id}`);
            console.log(`   Status: ${reward.isActive ? '✅ Active' : '❌ Inactive'}`);
            console.log(`   Points: ${reward.pointsRequired}`);
            console.log(`   Discount: ${reward.discountValue}${reward.discountType === 'percentage' ? '%' : ' PHP'}`);
            console.log('');
        });

        console.log('\n🔗 Test URLs (after logging in as super admin):');
        console.log('='.repeat(80));
        
        if (rewards.length > 0) {
            const testReward = rewards[0];
            console.log(`\n1. View Rewards List:`);
            console.log(`   http://localhost:3000/admin/rewards`);
            
            console.log(`\n2. Test Activate (using browser console):`);
            console.log(`   fetch('/admin/rewards/${testReward._id}/activate', {`);
            console.log(`     method: 'POST',`);
            console.log(`     headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }`);
            console.log(`   }).then(r => r.json()).then(console.log)`);
            
            console.log(`\n3. Test Deactivate (using browser console):`);
            console.log(`   fetch('/admin/rewards/${testReward._id}/deactivate', {`);
            console.log(`     method: 'POST',`);
            console.log(`     headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }`);
            console.log(`   }).then(r => r.json()).then(console.log)`);
            
            console.log(`\n4. Test Delete (using browser console):`);
            console.log(`   fetch('/admin/rewards/${testReward._id}/delete', {`);
            console.log(`     method: 'DELETE',`);
            console.log(`     headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }`);
            console.log(`   }).then(r => r.json()).then(console.log)`);
        }

        console.log('\n\n📝 IMPORTANT STEPS:');
        console.log('='.repeat(80));
        console.log('1. Get admin access link:');
        console.log('   node scripts/show-permanent-admin-link.js');
        console.log('\n2. Open the link in browser and log in as super admin');
        console.log('   Email: ams202052026@gmail.com');
        console.log('   Password: admin123');
        console.log('\n3. Navigate to: http://localhost:3000/admin/rewards');
        console.log('\n4. Try clicking Activate/Deactivate/Delete buttons');
        console.log('\n5. If still getting errors, open browser console (F12) and check:');
        console.log('   - Network tab for the request/response');
        console.log('   - Console tab for JavaScript errors');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

testRewardsActions();

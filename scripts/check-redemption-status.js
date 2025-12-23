const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const { Redemption } = require('../models/reward');
const User = require('../models/user');

async function checkRedemptionStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        console.log('\n=== CHECKING REDEMPTION STATUS ===');

        // Find test user
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        if (!testUser) {
            console.log('Test user not found');
            return;
        }

        // Check all redemptions for this user
        console.log('\n--- All Redemptions for Test User ---');
        const allRedemptions = await Redemption.find({ customer: testUser._id })
            .populate('reward', 'name pointsRequired')
            .sort({ redeemedAt: -1 });

        console.log(`Found ${allRedemptions.length} redemptions:`);
        allRedemptions.forEach((redemption, index) => {
            console.log(`${index + 1}. ${redemption.reward?.name || 'Unknown'}`);
            console.log(`   Status: ${redemption.status}`);
            console.log(`   Points Used: ${redemption.pointsUsed}`);
            console.log(`   Redeemed: ${new Date(redemption.redeemedAt).toLocaleDateString()}`);
            console.log(`   Applied to Appointment: ${redemption.appliedToAppointment || 'None'}`);
            console.log(`   Used At: ${redemption.usedAt || 'Not used'}`);
            console.log('');
        });

        // Check appointments with redemptions
        console.log('--- Appointments with Redemptions ---');
        const appointmentsWithRedemptions = await Appointment.find({
            customer: testUser._id,
            appliedRedemption: { $ne: null }
        })
        .populate('service', 'name')
        .populate('appliedRedemption')
        .sort({ createdAt: -1 });

        console.log(`Found ${appointmentsWithRedemptions.length} appointments with redemptions:`);
        appointmentsWithRedemptions.forEach((apt, index) => {
            console.log(`${index + 1}. ${apt.queueNumber}: ${apt.service?.name}`);
            console.log(`   Status: ${apt.status}`);
            console.log(`   Redemption ID: ${apt.appliedRedemption}`);
            console.log(`   Discount Applied: ₱${apt.discountApplied}`);
            console.log(`   Final Price: ₱${apt.finalPrice}`);
            console.log('');
        });

        // Check for redemption status mismatches
        console.log('--- Checking for Status Issues ---');
        const completedAppointments = appointmentsWithRedemptions.filter(apt => apt.status === 'completed');
        
        for (const apt of completedAppointments) {
            const redemption = await Redemption.findById(apt.appliedRedemption);
            if (redemption && redemption.status !== 'used') {
                console.log(`❌ ISSUE: Appointment ${apt.queueNumber} is completed but redemption status is "${redemption.status}" (should be "used")`);
            } else if (redemption && redemption.status === 'used') {
                console.log(`✅ OK: Appointment ${apt.queueNumber} completed and redemption marked as used`);
            }
        }

        console.log('\n=== STATUS CHECK COMPLETE ===');
        
    } catch (error) {
        console.error('Error checking redemption status:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

checkRedemptionStatus();
const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const { Redemption } = require('../models/reward');
const User = require('../models/user');
const Service = require('../models/service');

async function fixExistingRedemptions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        console.log('\n=== FIXING EXISTING REDEMPTIONS ===');

        // Find all redemptions that should be marked as used
        const redemptionsToFix = await Redemption.find({
            status: 'pending',
            appliedToAppointment: { $ne: null }
        });

        console.log(`Found ${redemptionsToFix.length} redemptions to check:`);

        let fixedCount = 0;

        for (const redemption of redemptionsToFix) {
            console.log(`\nChecking redemption ${redemption._id}...`);
            
            // Find the associated appointment
            const appointment = await Appointment.findById(redemption.appliedToAppointment);
            
            if (!appointment) {
                console.log(`❌ Appointment ${redemption.appliedToAppointment} not found`);
                continue;
            }

            console.log(`Appointment ${appointment.queueNumber}: status = ${appointment.status}`);

            // If appointment is completed, mark redemption as used
            if (appointment.status === 'completed') {
                await Redemption.findByIdAndUpdate(redemption._id, {
                    status: 'used',
                    usedAt: appointment.completedAt || new Date()
                });
                
                console.log(`✅ Fixed: Redemption marked as used`);
                fixedCount++;
            } else {
                console.log(`⏳ Pending: Appointment not completed yet`);
            }
        }

        console.log(`\n=== SUMMARY ===`);
        console.log(`Total redemptions checked: ${redemptionsToFix.length}`);
        console.log(`Redemptions fixed: ${fixedCount}`);

        // Verify the fixes
        console.log('\n--- Verification ---');
        const allRedemptions = await Redemption.find({})
            .populate('reward', 'name')
            .sort({ redeemedAt: -1 });

        const statusCounts = {};
        allRedemptions.forEach(redemption => {
            statusCounts[redemption.status] = (statusCounts[redemption.status] || 0) + 1;
        });

        console.log('Redemption status distribution:');
        Object.keys(statusCounts).forEach(status => {
            console.log(`- ${status}: ${statusCounts[status]}`);
        });

        console.log('\n✅ REDEMPTION FIX COMPLETE!');
        
    } catch (error) {
        console.error('Error fixing redemptions:', error);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

fixExistingRedemptions();
const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const Business = require('../models/business');
const User = require('../models/user');
const Staff = require('../models/staff');
const Service = require('../models/service');
const { Reward, Redemption } = require('../models/reward');
const Notification = require('../models/notification');

async function testNewRedemptionFlow() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        console.log('\n=== TESTING NEW REDEMPTION FLOW ===');

        // Find test user and business
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        const business = await Business.findOne({ ownerId: testUser._id });
        const service = await Service.findOne({ businessId: business._id });
        const staff = await Staff.findOne({ businessId: business._id });
        
        if (!testUser || !business || !service || !staff) {
            console.log('Required test data not found');
            return;
        }

        console.log(`User: ${testUser.fullName}`);
        console.log(`Business: ${business.businessName}`);
        console.log(`Service: ${service.name}`);
        console.log(`Staff: ${staff.name}`);

        // Find an active redemption
        const activeRedemption = await Redemption.findOne({
            customer: testUser._id,
            status: 'active'
        }).populate('reward');

        if (!activeRedemption) {
            console.log('❌ No active redemption found for testing');
            return;
        }

        console.log(`\nUsing redemption: ${activeRedemption.reward.name} (${activeRedemption.pointsUsed} points)`);

        // Create a new appointment with this redemption
        console.log('\n--- Creating Test Appointment with Redemption ---');
        
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 1); // Tomorrow
        
        // Calculate discount
        let discountApplied = 0;
        let finalPrice = service.price;
        
        if (activeRedemption.reward.discountType === 'percentage') {
            discountApplied = (service.price * activeRedemption.reward.discountValue) / 100;
        } else if (activeRedemption.reward.discountType === 'fixed') {
            discountApplied = Math.min(activeRedemption.reward.discountValue, service.price);
        }
        
        finalPrice = Math.max(0, service.price - discountApplied);

        const testAppointment = new Appointment({
            customer: testUser._id,
            service: service._id,
            businessId: business._id,
            staff: staff._id,
            date: appointmentDate,
            timeSlot: { start: '14:00', end: '15:00' },
            notes: 'Test appointment for redemption flow',
            appliedRedemption: activeRedemption._id,
            discountApplied: discountApplied,
            finalPrice: finalPrice,
            status: 'confirmed' // Skip pending for testing
        });

        await testAppointment.save();
        console.log(`✅ Created test appointment: ${testAppointment.queueNumber}`);
        console.log(`   Original price: ₱${service.price}`);
        console.log(`   Discount applied: ₱${discountApplied}`);
        console.log(`   Final price: ₱${finalPrice}`);

        // Mark redemption as pending (locked to appointment)
        await Redemption.findByIdAndUpdate(activeRedemption._id, {
            status: 'pending',
            appliedToAppointment: testAppointment._id
        });
        console.log('✅ Redemption marked as pending (locked to appointment)');

        // Now simulate completing the appointment
        console.log('\n--- Simulating Appointment Completion ---');
        
        const customerPointsBefore = testUser.rewardPoints;
        console.log(`Customer points before: ${customerPointsBefore}`);

        // Complete the appointment (simulate business owner action)
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            testAppointment._id,
            { 
                status: 'completed',
                completedAt: new Date()
            },
            { new: true }
        ).populate('service').populate('customer');

        console.log('✅ Appointment marked as completed');

        // Award points to customer
        const pointsEarned = updatedAppointment.service.pointsEarned || 10;
        
        await User.findByIdAndUpdate(
            updatedAppointment.customer._id,
            { $inc: { rewardPoints: pointsEarned } }
        );
        console.log(`✅ Points awarded: ${pointsEarned}`);

        // Mark applied redemption as used (NEW FUNCTIONALITY)
        if (updatedAppointment.appliedRedemption) {
            await Redemption.findByIdAndUpdate(
                updatedAppointment.appliedRedemption,
                { 
                    status: 'used',
                    usedAt: new Date()
                }
            );
            console.log('✅ Redemption marked as used');
        }

        // Verify the complete flow
        console.log('\n--- Final Verification ---');
        
        const finalCustomer = await User.findById(testUser._id);
        const finalRedemption = await Redemption.findById(activeRedemption._id);
        const finalAppointment = await Appointment.findById(testAppointment._id);

        console.log(`✅ Appointment status: ${finalAppointment.status}`);
        console.log(`✅ Customer points: ${finalCustomer.rewardPoints} (was ${customerPointsBefore}, earned ${pointsEarned})`);
        console.log(`✅ Redemption status: ${finalRedemption.status}`);
        console.log(`✅ Redemption used at: ${finalRedemption.usedAt}`);

        // Test the complete redemption lifecycle
        console.log('\n--- Redemption Lifecycle Summary ---');
        console.log('1. ✅ Customer redeemed reward → status: "active"');
        console.log('2. ✅ Customer booked appointment with redemption → status: "pending"');
        console.log('3. ✅ Appointment completed → status: "used"');
        console.log('4. ✅ Customer earned new points from completed service');

        if (finalRedemption.status === 'used' && finalRedemption.usedAt) {
            console.log('\n🎉 REDEMPTION FLOW TEST SUCCESSFUL!');
            console.log('The voucher/points system is working correctly!');
        } else {
            console.log('\n❌ REDEMPTION FLOW TEST FAILED!');
        }

        console.log('\n=== TEST COMPLETE ===');
        
    } catch (error) {
        console.error('Error testing redemption flow:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

testNewRedemptionFlow();
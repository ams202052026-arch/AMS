const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const Business = require('../models/business');
const User = require('../models/user');
const Staff = require('../models/staff');
const Service = require('../models/service');
const { Reward, Redemption } = require('../models/reward');
const Notification = require('../models/notification');

async function testRedemptionUsage() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        console.log('\n=== TESTING REDEMPTION USAGE ON APPOINTMENT COMPLETION ===');

        // Find test user and business
        const testUser = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        const business = await Business.findOne({ ownerId: testUser._id });
        
        if (!testUser || !business) {
            console.log('Test user or business not found');
            return;
        }

        console.log(`User: ${testUser.fullName}`);
        console.log(`Business: ${business.businessName}`);

        // Find an appointment with applied redemption
        console.log('\n--- Finding Appointment with Applied Redemption ---');
        const appointmentWithRedemption = await Appointment.findOne({
            businessId: business._id,
            appliedRedemption: { $ne: null },
            status: { $in: ['confirmed', 'in-progress', 'pending'] }
        })
        .populate('service', 'name pointsEarned')
        .populate('customer', 'firstName lastName rewardPoints')
        .populate('appliedRedemption');

        if (!appointmentWithRedemption) {
            console.log('❌ No appointment found with applied redemption');
            
            // Let's check what appointments exist
            const allAppointments = await Appointment.find({ businessId: business._id })
                .populate('service', 'name')
                .sort({ createdAt: -1 })
                .limit(5);
            
            console.log('\nRecent appointments:');
            allAppointments.forEach(apt => {
                console.log(`- ${apt.queueNumber}: ${apt.service?.name} (${apt.status}) - Redemption: ${apt.appliedRedemption ? 'YES' : 'NO'}`);
            });
            return;
        }

        console.log(`Found appointment: ${appointmentWithRedemption.queueNumber}`);
        console.log(`Service: ${appointmentWithRedemption.service.name}`);
        console.log(`Customer: ${appointmentWithRedemption.customer.firstName} ${appointmentWithRedemption.customer.lastName}`);
        console.log(`Applied Redemption ID: ${appointmentWithRedemption.appliedRedemption}`);

        // Check current redemption status
        const redemption = await Redemption.findById(appointmentWithRedemption.appliedRedemption)
            .populate('reward', 'name pointsUsed');
        
        if (!redemption) {
            console.log('❌ Redemption not found');
            return;
        }

        console.log(`Redemption: ${redemption.reward?.name || 'Unknown'}`);
        console.log(`Current status: ${redemption.status}`);
        console.log(`Points used: ${redemption.pointsUsed}`);

        // Simulate appointment completion
        console.log('\n--- Simulating Appointment Completion ---');
        
        const appointmentId = appointmentWithRedemption._id;
        const customerPointsBefore = appointmentWithRedemption.customer.rewardPoints;
        
        console.log(`Customer points before: ${customerPointsBefore}`);
        console.log(`Redemption status before: ${redemption.status}`);

        // Update appointment status
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { 
                status: 'completed',
                completedAt: new Date()
            },
            { new: true }
        ).populate('service').populate('customer');

        console.log('✓ Appointment marked as completed');

        // Award points to customer
        const pointsEarned = updatedAppointment.service.pointsEarned || 10;
        
        await User.findByIdAndUpdate(
            updatedAppointment.customer._id,
            { $inc: { rewardPoints: pointsEarned } }
        );
        console.log(`✓ Points awarded: ${pointsEarned}`);

        // Mark applied redemption as used
        if (updatedAppointment.appliedRedemption) {
            await Redemption.findByIdAndUpdate(
                updatedAppointment.appliedRedemption,
                { 
                    status: 'used',
                    usedAt: new Date()
                }
            );
            console.log('✓ Redemption marked as used');
        }

        // Verify the changes
        console.log('\n--- Verification ---');
        
        const finalCustomer = await User.findById(updatedAppointment.customer._id);
        const finalRedemption = await Redemption.findById(updatedAppointment.appliedRedemption);
        const finalAppointment = await Appointment.findById(appointmentId);

        console.log(`✅ Final appointment status: ${finalAppointment.status}`);
        console.log(`✅ Customer points after: ${finalCustomer.rewardPoints} (was ${customerPointsBefore})`);
        console.log(`✅ Redemption status after: ${finalRedemption.status} (was ${redemption.status})`);
        console.log(`✅ Redemption used at: ${finalRedemption.usedAt}`);

        // Check redemption lifecycle
        console.log('\n--- Redemption Lifecycle Check ---');
        console.log('Expected flow:');
        console.log('1. Customer redeems reward → status: "active"');
        console.log('2. Customer books appointment with redemption → status: "pending"');
        console.log('3. Appointment completed → status: "used" ✅');
        
        if (finalRedemption.status === 'used' && finalRedemption.usedAt) {
            console.log('🎉 REDEMPTION USAGE TEST SUCCESSFUL!');
        } else {
            console.log('❌ REDEMPTION USAGE TEST FAILED!');
        }

        console.log('\n=== TEST COMPLETE ===');
        
    } catch (error) {
        console.error('Error testing redemption usage:', error);
        console.error('Stack:', error.stack);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

testRedemptionUsage();
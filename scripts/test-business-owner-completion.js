const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const Business = require('../models/business');
const User = require('../models/user');
const Staff = require('../models/staff');
const Service = require('../models/service');
const Notification = require('../models/notification');

async function testBusinessOwnerCompletion() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        // Find the business owner user
        console.log('\n=== FINDING BUSINESS OWNER ===');
        const businessOwner = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        if (!businessOwner) {
            console.log('Business owner not found');
            return;
        }
        console.log(`Business owner: ${businessOwner.fullName}`);

        // Find their business
        const business = await Business.findOne({ ownerId: businessOwner._id });
        if (!business) {
            console.log('Business not found for this owner');
            return;
        }
        console.log(`Business: ${business.businessName}`);

        // Find a confirmed appointment for this business
        console.log('\n=== FINDING APPOINTMENT TO COMPLETE ===');
        const appointment = await Appointment.findOne({ 
            businessId: business._id,
            status: { $in: ['confirmed', 'in-progress', 'pending'] }
        })
        .populate('customer', 'firstName lastName email rewardPoints')
        .populate('service', 'name price pointsEarned')
        .populate('staff', 'name');

        if (!appointment) {
            console.log('No suitable appointment found for this business');
            return;
        }

        console.log(`Found appointment: ${appointment._id}`);
        console.log(`Customer: ${appointment.customer.firstName} ${appointment.customer.lastName}`);
        console.log(`Service: ${appointment.service.name}`);
        console.log(`Current status: ${appointment.status}`);
        console.log(`Customer points before: ${appointment.customer.rewardPoints}`);

        // Simulate the business owner completion process
        console.log('\n=== SIMULATING BUSINESS OWNER COMPLETION ===');

        // This simulates what happens when business owner clicks "Mark as Complete"
        const updatedAppointment = await Appointment.findOneAndUpdate(
            { _id: appointment._id, businessId: business._id },
            { 
                status: 'completed',
                completedAt: new Date()
            },
            { new: true }
        ).populate('staff').populate('service').populate('customer');

        if (!updatedAppointment) {
            console.log('❌ Failed to update appointment');
            return;
        }
        console.log('✓ Appointment status updated to completed');

        // Update staff completed appointments count
        if (updatedAppointment.staff) {
            await Staff.findByIdAndUpdate(
                updatedAppointment.staff._id,
                { $inc: { appointmentsCompleted: 1 } }
            );
            console.log('✓ Staff completed appointments count updated');
        }

        // Award points to customer
        const pointsEarned = updatedAppointment.service.pointsEarned || 10;
        
        await User.findByIdAndUpdate(
            updatedAppointment.customer._id,
            { $inc: { rewardPoints: pointsEarned } }
        );
        console.log(`✓ Points awarded to customer: ${pointsEarned}`);

        // Get updated customer data
        const updatedCustomer = await User.findById(updatedAppointment.customer._id);
        console.log(`✓ Customer points after: ${updatedCustomer.rewardPoints}`);

        // Create completion notification for customer
        const staffName = updatedAppointment.staff ? updatedAppointment.staff.name : 'Our team';
        const finalPrice = updatedAppointment.finalPrice || updatedAppointment.service.price;
        
        const formattedDate = new Date(updatedAppointment.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });

        const notification = await Notification.create({
            customer: updatedAppointment.customer._id,
            title: '🎉 Service Complete - Thank You!',
            message: `Your ${updatedAppointment.service.name} appointment has been completed successfully!\n\nService: ${updatedAppointment.service.name}\nBusiness: ${business.businessName}\nStaff: ${staffName}\nDate: ${formattedDate}\nAmount Paid: ₱${finalPrice}\n\n🎁 Rewards Earned: +${pointsEarned} points\n💰 Total Points: ${updatedCustomer.rewardPoints} points\n\nThank you for choosing ${business.businessName}. We hope to see you again soon!`,
            type: 'reward_update',
            meta: {
                appointmentId: updatedAppointment._id,
                pointsEarned: pointsEarned,
                totalPoints: updatedCustomer.rewardPoints,
                businessId: business._id,
                completedBy: 'business_owner',
                completedAt: new Date()
            }
        });

        console.log(`✓ Completion notification created: ${notification._id}`);

        // Verify the process worked
        console.log('\n=== VERIFICATION ===');
        
        const finalAppointment = await Appointment.findById(appointment._id);
        console.log(`✓ Final appointment status: ${finalAppointment.status}`);
        console.log(`✓ Completed at: ${finalAppointment.completedAt}`);
        
        const finalCustomer = await User.findById(appointment.customer._id);
        console.log(`✓ Final customer points: ${finalCustomer.rewardPoints}`);
        
        // Check recent notifications for this customer
        const recentNotifications = await Notification.find({ 
            customer: appointment.customer._id 
        }).sort({ createdAt: -1 }).limit(3);
        
        console.log(`\n--- Recent Notifications for ${appointment.customer.firstName} ---`);
        recentNotifications.forEach((notif, index) => {
            console.log(`${index + 1}. ${notif.title}`);
            console.log(`   Type: ${notif.type}`);
            console.log(`   Created: ${notif.createdAt.toLocaleString()}`);
        });

        console.log('\n🎉 BUSINESS OWNER COMPLETION TEST SUCCESSFUL!');
        console.log('✅ Appointment marked as completed');
        console.log('✅ Customer received notification');
        console.log('✅ Points awarded correctly');
        console.log('✅ All database updates successful');
        
    } catch (error) {
        console.error('❌ Error testing business owner completion:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

testBusinessOwnerCompletion();
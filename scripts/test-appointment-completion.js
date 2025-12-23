const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const Business = require('../models/business');
const User = require('../models/user');
const Staff = require('../models/staff');
const Service = require('../models/service');
const Notification = require('../models/notification');

async function testAppointmentCompletion() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams');
        console.log('Connected to MongoDB');

        // Find a test appointment that can be completed
        console.log('\n=== FINDING TEST APPOINTMENT ===');
        
        const testAppointment = await Appointment.findOne({ 
            status: { $in: ['confirmed', 'in-progress', 'pending'] }
        })
        .populate('customer', 'firstName lastName email rewardPoints')
        .populate('service', 'name price pointsEarned')
        .populate('staff', 'name')
        .populate('businessId', 'businessName ownerId');

        if (!testAppointment) {
            console.log('No suitable test appointment found');
            return;
        }

        console.log(`Found appointment: ${testAppointment._id}`);
        console.log(`Customer: ${testAppointment.customer.firstName} ${testAppointment.customer.lastName}`);
        console.log(`Service: ${testAppointment.service.name}`);
        console.log(`Current status: ${testAppointment.status}`);
        console.log(`Customer points before: ${testAppointment.customer.rewardPoints}`);

        // Simulate the completion process
        console.log('\n=== SIMULATING COMPLETION PROCESS ===');

        // 1. Update appointment status
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            testAppointment._id,
            { 
                status: 'completed',
                completedAt: new Date()
            },
            { new: true }
        ).populate('customer').populate('service').populate('staff').populate('businessId');

        console.log('✓ Appointment status updated to completed');

        // 2. Update staff completed appointments count (if staff exists)
        if (updatedAppointment.staff) {
            await Staff.findByIdAndUpdate(
                updatedAppointment.staff._id,
                { $inc: { appointmentsCompleted: 1 } }
            );
            console.log('✓ Staff completed appointments count updated');
        }

        // 3. Award points to customer
        const pointsEarned = updatedAppointment.service.pointsEarned || 10;
        
        await User.findByIdAndUpdate(
            updatedAppointment.customer._id,
            { $inc: { rewardPoints: pointsEarned } }
        );
        console.log(`✓ Points awarded: ${pointsEarned}`);

        // 4. Get updated customer data
        const updatedCustomer = await User.findById(updatedAppointment.customer._id);
        console.log(`✓ Customer points after: ${updatedCustomer.rewardPoints}`);

        // 5. Create completion notification
        const business = updatedAppointment.businessId;
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

        // 6. Verify everything worked
        console.log('\n=== VERIFICATION ===');
        
        const finalAppointment = await Appointment.findById(testAppointment._id);
        console.log(`✓ Final appointment status: ${finalAppointment.status}`);
        console.log(`✓ Completed at: ${finalAppointment.completedAt}`);
        
        const finalCustomer = await User.findById(testAppointment.customer._id);
        console.log(`✓ Final customer points: ${finalCustomer.rewardPoints}`);
        
        const recentNotifications = await Notification.find({ 
            customer: testAppointment.customer._id 
        }).sort({ createdAt: -1 }).limit(1);
        
        if (recentNotifications.length > 0) {
            console.log(`✓ Latest notification: ${recentNotifications[0].title}`);
        }

        console.log('\n🎉 APPOINTMENT COMPLETION TEST SUCCESSFUL!');
        
    } catch (error) {
        console.error('Error testing appointment completion:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await mongoose.connection.close();
    }
}

// Load environment variables
require('dotenv').config();

testAppointmentCompletion();
/**
 * Business Owner Appointments Controller
 * Handles appointment management for business owners
 */

const Appointment = require('../../models/appointment');
const Business = require('../../models/business');
const User = require('../../models/user');
const Staff = require('../../models/staff');

/**
 * List all appointments for the business
 */
exports.listAppointments = async (req, res) => {
    try {
        const userId = req.session.userId;
        const filter = req.query.filter || 'all';
        
        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Build query based on filter
        let query = { businessId: business._id };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        switch (filter) {
            case 'today':
                query.date = { $gte: today, $lt: tomorrow };
                break;
            case 'pending':
                query.status = 'pending';
                break;
            case 'confirmed':
                query.status = 'confirmed';
                break;
            case 'completed':
                query.status = 'completed';
                break;
            case 'cancelled':
                query.status = 'cancelled';
                break;
        }

        // Get appointments for this business
        const appointments = await Appointment.find(query)
            .populate('customer', 'firstName lastName email')
            .populate('service', 'name price')
            .populate('staff', 'name')
            .sort({ date: -1, timeSlot: 1 });

        // Calculate stats
        const stats = {
            today: await Appointment.countDocuments({
                businessId: business._id,
                date: { $gte: today, $lt: tomorrow }
            }),
            pending: await Appointment.countDocuments({
                businessId: business._id,
                status: 'pending'
            }),
            confirmed: await Appointment.countDocuments({
                businessId: business._id,
                status: 'confirmed'
            }),
            completed: await Appointment.countDocuments({
                businessId: business._id,
                status: 'completed'
            })
        };

        // Get user data
        const user = await User.findById(userId);

        res.render('businessOwner/appointments/list', { 
            appointments, 
            business,
            user,
            filter,
            stats
        });
    } catch (error) {
        console.error('Error loading appointments:', error);
        res.status(500).render('error', { 
            title: 'Error Loading Appointments',
            message: 'Error loading appointments',
            statusCode: 500
        });
    }
};

/**
 * Confirm appointment
 */
exports.confirmAppointment = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { appointmentId } = req.params;

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Update appointment status (ensure it belongs to this business)
        const appointment = await Appointment.findOneAndUpdate(
            { _id: appointmentId, businessId: business._id },
            { status: 'confirmed' },
            { new: true }
        ).populate('service').populate('staff').populate('customer');

        if (!appointment) {
            return res.status(404).render('error', {
                title: 'Appointment Not Found',
                message: 'Appointment not found or does not belong to your business',
                statusCode: 404
            });
        }

        // Create confirmation notification for customer
        const Notification = require('../../models/notification');
        const { formatTime12Hour } = require('../../utils/timeFormat');
        
        const staffName = appointment.staff ? appointment.staff.name : 'Our team';
        const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        const formattedStartTime = formatTime12Hour(appointment.timeSlot.start);
        const formattedEndTime = formatTime12Hour(appointment.timeSlot.end);

        await Notification.create({
            customer: appointment.customer._id,
            title: 'Appointment Confirmed!',
            message: `Great news! Your appointment has been confirmed by ${business.businessName}.\n\nService: ${appointment.service.name}\nDate: ${formattedDate}\nTime: ${formattedStartTime} - ${formattedEndTime}\nStaff: ${staffName}\nQueue Number: ${appointment.queueNumber}\nBusiness: ${business.businessName}\n\nPlease arrive 5-10 minutes early. We look forward to serving you!`,
            type: 'appointment_confirm',
            meta: {
                appointmentId: appointment._id,
                queueNumber: appointment.queueNumber,
                businessId: business._id,
                confirmedBy: 'business_owner',
                confirmedAt: new Date()
            }
        });

        // Send confirmation email
        const emailService = require('../../services/emailService');
        await emailService.sendAppointmentConfirmationEmail(appointment, business, appointment.customer);

        console.log('✓ Appointment confirmed:', appointmentId);
        console.log('✓ Confirmation notification sent to customer');
        console.log('✓ Confirmation email sent to customer');
        res.redirect('/business-owner/appointments');
    } catch (error) {
        console.error('Error confirming appointment:', error);
        res.status(500).render('error', { 
            title: 'Error Confirming Appointment',
            message: 'Error confirming appointment',
            statusCode: 500
        });
    }
};

/**
 * Complete appointment
 */
exports.completeAppointment = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { appointmentId } = req.params;

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Update appointment status (ensure it belongs to this business)
        const appointment = await Appointment.findOneAndUpdate(
            { _id: appointmentId, businessId: business._id },
            { 
                status: 'completed',
                completedAt: new Date()
            },
            { new: true }
        ).populate('staff').populate('service').populate('customer');

        if (!appointment) {
            return res.status(404).render('error', {
                title: 'Appointment Not Found',
                message: 'Appointment not found or does not belong to your business',
                statusCode: 404
            });
        }

        // Update staff completed appointments count
        if (appointment.staff) {
            await Staff.findByIdAndUpdate(
                appointment.staff._id,
                { $inc: { appointmentsCompleted: 1 } }
            );
        }

        // Award points to customer
        const pointsEarned = appointment.service.pointsEarned || 10;
        
        await User.findByIdAndUpdate(
            appointment.customer._id,
            { $inc: { rewardPoints: pointsEarned } }
        );

        // Mark applied redemption as used
        if (appointment.appliedRedemption) {
            const { Redemption } = require('../../models/reward');
            await Redemption.findByIdAndUpdate(
                appointment.appliedRedemption,
                { 
                    status: 'used',
                    usedAt: new Date()
                }
            );
            console.log('✓ Redemption marked as used:', appointment.appliedRedemption);
        }

        // Get updated customer data
        const customer = await User.findById(appointment.customer._id);

        // Create completion notification for customer
        const Notification = require('../../models/notification');
        const staffName = appointment.staff ? appointment.staff.name : 'Our team';
        const finalPrice = appointment.finalPrice || appointment.service.price;
        
        const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });

        await Notification.create({
            customer: appointment.customer._id,
            title: 'Service Complete - Thank You!',
            message: `Your ${appointment.service.name} appointment has been completed successfully!\n\nService: ${appointment.service.name}\nBusiness: ${business.businessName}\nStaff: ${staffName}\nDate: ${formattedDate}\nAmount Paid: ₱${finalPrice}\n\nRewards Earned: +${pointsEarned} points\nTotal Points: ${customer.rewardPoints} points\n\nThank you for choosing ${business.businessName}. We hope to see you again soon!`,
            type: 'reward_update',
            meta: {
                appointmentId: appointment._id,
                pointsEarned: pointsEarned,
                totalPoints: customer.rewardPoints,
                businessId: business._id,
                completedBy: 'business_owner',
                completedAt: new Date()
            }
        });

        // Send completion email
        const emailService = require('../../services/emailService');
        await emailService.sendAppointmentCompletionEmail(appointment, business, customer, pointsEarned);

        console.log('✓ Appointment completed:', appointmentId);
        console.log('✓ Completion notification sent to customer');
        console.log('✓ Completion email sent to customer');
        console.log('✓ Points awarded:', pointsEarned);
        res.redirect('/business-owner/appointments');
    } catch (error) {
        console.error('Error completing appointment:', error);
        res.status(500).render('error', { 
            title: 'Error Completing Appointment',
            message: 'Error completing appointment',
            statusCode: 500
        });
    }
};

/**
 * Cancel appointment
 */
exports.cancelAppointment = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { appointmentId } = req.params;

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Update appointment status (ensure it belongs to this business)
        const appointment = await Appointment.findOneAndUpdate(
            { _id: appointmentId, businessId: business._id },
            { 
                status: 'cancelled',
                cancelledAt: new Date(),
                cancelledBy: 'business'
            },
            { new: true }
        ).populate('service').populate('staff').populate('customer');

        if (!appointment) {
            return res.status(404).render('error', {
                title: 'Appointment Not Found',
                message: 'Appointment not found or does not belong to your business',
                statusCode: 404
            });
        }

        // Create cancellation notification for customer
        const Notification = require('../../models/notification');
        const { formatTime12Hour } = require('../../utils/timeFormat');
        
        const staffName = appointment.staff ? appointment.staff.name : 'Our team';
        const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        const formattedStartTime = formatTime12Hour(appointment.timeSlot.start);
        const formattedEndTime = formatTime12Hour(appointment.timeSlot.end);

        await Notification.create({
            customer: appointment.customer._id,
            title: '❌ Appointment Cancelled',
            message: `We're sorry, but your appointment has been cancelled by ${business.businessName}.\n\nService: ${appointment.service.name}\nDate: ${formattedDate}\nTime: ${formattedStartTime} - ${formattedEndTime}\nStaff: ${staffName}\nQueue Number: ${appointment.queueNumber}\nBusiness: ${business.businessName}\n\nWe apologize for any inconvenience. Please feel free to book another appointment or contact us for assistance.`,
            type: 'appointment_cancelled',
            meta: {
                appointmentId: appointment._id,
                queueNumber: appointment.queueNumber,
                businessId: business._id,
                cancelledBy: 'business_owner',
                cancelledAt: new Date(),
                reason: 'Cancelled by business'
            }
        });

        console.log('✓ Appointment cancelled:', appointmentId);
        console.log('✓ Cancellation notification sent to customer');
        res.redirect('/business-owner/appointments');
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).render('error', { 
            title: 'Error Cancelling Appointment',
            message: 'Error cancelling appointment',
            statusCode: 500
        });
    }
};

/**
 * Mark appointment as no-show
 */
exports.markNoShow = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { appointmentId } = req.params;

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Update appointment status (ensure it belongs to this business)
        const appointment = await Appointment.findOneAndUpdate(
            { _id: appointmentId, businessId: business._id },
            { status: 'no-show' },
            { new: true }
        ).populate('service').populate('staff').populate('customer');

        if (appointment) {
            // Create no-show notification for customer
            const Notification = require('../../models/notification');
            const { formatTime12Hour } = require('../../utils/timeFormat');
            
            const staffName = appointment.staff ? appointment.staff.name : 'Our team';
            const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            const formattedStartTime = formatTime12Hour(appointment.timeSlot.start);

            await Notification.create({
                customer: appointment.customer._id,
                title: '⚠️ Missed Appointment',
                message: `You missed your scheduled appointment with ${business.businessName}.\n\nService: ${appointment.service.name}\nDate: ${formattedDate}\nTime: ${formattedStartTime}\nStaff: ${staffName}\nQueue Number: ${appointment.queueNumber}\n\nPlease contact us to reschedule or book a new appointment.`,
                type: 'appointment_cancelled',
                meta: {
                    appointmentId: appointment._id,
                    queueNumber: appointment.queueNumber,
                    businessId: business._id,
                    reason: 'No-show'
                }
            });
        }

        console.log('✓ Appointment marked as no-show:', appointmentId);
        res.redirect('/business-owner/appointments');
    } catch (error) {
        console.error('Error marking no-show:', error);
        res.status(500).render('error', { 
            title: 'Error Updating Appointment',
            message: 'Error updating appointment',
            statusCode: 500
        });
    }
};

/**
 * Start service (mark as in-progress)
 */
exports.startService = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { appointmentId } = req.params;

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Update appointment status (ensure it belongs to this business)
        const appointment = await Appointment.findOneAndUpdate(
            { _id: appointmentId, businessId: business._id },
            { 
                status: 'in-progress',
                startedAt: new Date()
            },
            { new: true }
        ).populate('service').populate('staff').populate('customer');

        if (!appointment) {
            return res.status(404).render('error', {
                title: 'Appointment Not Found',
                message: 'Appointment not found or does not belong to your business',
                statusCode: 404
            });
        }

        // Create "ready to serve" notification for customer
        const Notification = require('../../models/notification');
        const staffName = appointment.staff ? appointment.staff.name : 'Our team';

        await Notification.create({
            customer: appointment.customer._id,
            title: '🔔 It\'s Your Turn Now!',
            message: `We're ready to serve you! Please come to the service area immediately.\n\nQueue Number: ${appointment.queueNumber}\nService: ${appointment.service.name}\nStaff: ${staffName}\nBusiness: ${business.businessName}\n\nPlease proceed to ${staffName}'s station. We're excited to serve you!`,
            type: 'queue_update',
            meta: {
                appointmentId: appointment._id,
                queueNumber: appointment.queueNumber,
                businessId: business._id,
                startedBy: 'business_owner',
                startedAt: new Date()
            }
        });

        console.log('✓ Service started for appointment:', appointmentId);
        console.log('✓ Ready-to-serve notification sent to customer');
        res.redirect('/business-owner/appointments');
    } catch (error) {
        console.error('Error starting service:', error);
        res.status(500).render('error', { 
            title: 'Error Starting Service',
            message: 'Error starting service',
            statusCode: 500
        });
    }
};
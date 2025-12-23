const Appointment = require('../../models/appointment');
const Customer = require('../../models/customer');
const Service = require('../../models/service');
const Staff = require('../../models/staff');
const Notification = require('../../models/notification');
const { formatTime12Hour } = require('../../utils/timeFormat');

// List all appointments
exports.listAppointments = async (req, res) => {
    try {
        const { status, date, staff } = req.query;
        let filter = {};

        if (status) filter.status = status;
        if (date) {
            const d = new Date(date);
            filter.date = {
                $gte: new Date(d.setHours(0, 0, 0, 0)),
                $lt: new Date(d.setHours(23, 59, 59, 999))
            };
        }
        if (staff) filter.staff = staff;

        const appointments = await Appointment.find(filter)
            .populate('customer')
            .populate('service')
            .populate('staff')
            .sort({ date: 1, 'timeSlot.start': 1 });

        // Format times to 12-hour format
        const formattedAppointments = appointments.map(apt => {
            const aptObj = apt.toObject();
            aptObj.timeSlot.startFormatted = formatTime12Hour(aptObj.timeSlot.start);
            aptObj.timeSlot.endFormatted = formatTime12Hour(aptObj.timeSlot.end);
            return aptObj;
        });

        const staffList = await Staff.find({ isActive: true });

        res.render('admin/appointments/list', { appointments: formattedAppointments, staffList, filters: req.query });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading appointments' });
    }
};

// Approve appointment
exports.approveAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { status: 'approved' },
            { new: true }
        ).populate('service').populate('staff');

        // Create approval notification with proper formatting
        const { formatTime12Hour } = require('../../utils/timeFormat');
        const staffName = appointment.staff ? appointment.staff.name : 'Any Available';
        
        const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        const formattedStartTime = formatTime12Hour(appointment.timeSlot.start);
        const formattedEndTime = formatTime12Hour(appointment.timeSlot.end);
        
        await Notification.create({
            customer: appointment.customer,
            title: 'Appointment Approved!',
            message: `Great news! Your appointment has been approved.\n\nService: ${appointment.service.name}\nDate: ${formattedDate}\nTime: ${formattedStartTime} - ${formattedEndTime}\nStaff: ${staffName}\nQueue Number: ${appointment.queueNumber}\n\nPlease arrive 5-10 minutes early. We look forward to serving you!`,
            type: 'appointment_confirm',
            meta: {
                appointmentId: appointment._id,
                queueNumber: appointment.queueNumber,
                approvedAt: new Date()
            }
        });

        res.redirect('/admin/appointments');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error approving appointment' });
    }
};

// Cancel appointment
exports.cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { reason } = req.body;

        const appointment = await Appointment.findById(appointmentId);
        
        // If redemption was applied, return it to active status
        if (appointment.appliedRedemption) {
            const { Redemption } = require('../../models/reward');
            await Redemption.findByIdAndUpdate(appointment.appliedRedemption, {
                status: 'active',
                appliedToAppointment: null
            });
            console.log('✅ Redemption returned to active:', appointment.appliedRedemption);
        }

        appointment.status = 'cancelled';
        await appointment.save();

        // Populate for notification
        await appointment.populate('service');
        const { formatTime12Hour } = require('../../utils/timeFormat');

        await Notification.create({
            customer: appointment.customer,
            title: 'Appointment Cancelled',
            message: `We're sorry, but your appointment has been cancelled.\n\nService: ${appointment.service.name}\nDate: ${new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\nTime: ${formatTime12Hour(appointment.timeSlot.start)}\nQueue: ${appointment.queueNumber}${reason ? '\nReason: ' + reason : ''}\n\nPlease book again or contact us for assistance.`,
            type: 'appointment_cancelled',
            meta: {
                appointmentId: appointment._id,
                queueNumber: appointment.queueNumber
            }
        });

        res.redirect('/admin/appointments');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error cancelling appointment' });
    }
};

// Complete appointment
exports.completeAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const appointment = await Appointment.findById(appointmentId).populate('service').populate('staff');

        appointment.status = 'completed';
        appointment.completedAt = new Date();
        appointment.pointsAwarded = appointment.service.pointsEarned;
        await appointment.save();

        // Award points to customer
        await Customer.findByIdAndUpdate(appointment.customer, {
            $inc: { rewardPoints: appointment.service.pointsEarned }
        });

        // Update staff stats
        if (appointment.staff) {
            await Staff.findByIdAndUpdate(appointment.staff, {
                $inc: { appointmentsCompleted: 1 }
            });
        }

        // Delete redemption if one was applied (reward consumed)
        if (appointment.appliedRedemption) {
            const { Redemption } = require('../../models/reward');
            await Redemption.findByIdAndDelete(appointment.appliedRedemption);
            console.log('✅ Redemption deleted (reward consumed):', appointment.appliedRedemption);
        }

        // Create completion notification with proper customer data
        const customer = await Customer.findById(appointment.customer);
        const { formatTime12Hour } = require('../../utils/timeFormat');
        const staffName = appointment.staff ? appointment.staff.name : 'Our team';
        const pointsEarned = appointment.service.pointsEarned || 10;
        const finalPrice = appointment.finalPrice || appointment.service.price;
        
        const formattedDate = new Date(appointment.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        
        await Notification.create({
            customer: appointment.customer,
            title: '🎉 Service Complete - Thank You!',
            message: `Your ${appointment.service.name} appointment has been completed successfully!\n\nService: ${appointment.service.name}\nStaff: ${staffName}\nDate: ${formattedDate}\nAmount Paid: ₱${finalPrice}\n\n🎁 Rewards Earned: +${pointsEarned} points\n💰 Total Points: ${customer ? customer.rewardPoints : 'N/A'} points\n\nThank you for choosing our service. We hope to see you again soon!`,
            type: 'reward_update',
            meta: {
                appointmentId: appointment._id,
                pointsEarned: pointsEarned,
                totalPoints: customer ? customer.rewardPoints : 0,
                completedAt: new Date()
            }
        });

        res.redirect('/admin/appointments');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error completing appointment' });
    }
};

// Reschedule functionality removed - admins cannot reschedule appointments
// If rescheduling is needed, admin should cancel and customer should rebook

// Assign staff to appointment
exports.assignStaff = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { staffId } = req.body;

        await Appointment.findByIdAndUpdate(appointmentId, { staff: staffId });
        res.redirect('/admin/appointments');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error assigning staff' });
    }
};

// Add walk-in appointment
exports.addWalkIn = async (req, res) => {
    try {
        const { customerName, customerEmail, serviceId, staffId, notes } = req.body;

        // Find or create customer
        let customer = await Customer.findOne({ email: customerEmail });
        if (!customer) {
            customer = new Customer({
                name: customerName,
                email: customerEmail,
                password: 'walkin-temp',
                isVerified: true
            });
            await customer.save();
        }

        const now = new Date();
        const appointment = new Appointment({
            customer: customer._id,
            service: serviceId,
            staff: staffId || null,
            date: now,
            timeSlot: {
                start: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
                end: `${String(now.getHours() + 1).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
            },
            isWalkIn: true,
            status: 'approved',
            notes
        });

        await appointment.save();
        res.redirect('/admin/queue');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error adding walk-in' });
    }
};

// Delete appointment (only for completed or cancelled)
exports.deleteAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).render('error', { message: 'Appointment not found' });
        }

        // Only allow deletion of completed or cancelled appointments
        if (appointment.status !== 'completed' && appointment.status !== 'cancelled') {
            return res.status(400).render('error', { 
                message: 'Only completed or cancelled appointments can be deleted. Please cancel the appointment first if needed.' 
            });
        }

        await Appointment.findByIdAndDelete(appointmentId);
        
        console.log('✅ Appointment deleted:', appointmentId);
        res.redirect('/admin/appointments');
    } catch (error) {
        console.error('❌ Error deleting appointment:', error);
        res.status(500).render('error', { message: 'Error deleting appointment' });
    }
};

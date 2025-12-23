const Appointment = require('../../models/appointment');
const Staff = require('../../models/staff');
const Service = require('../../models/service');
const { formatTime12Hour } = require('../../utils/timeFormat');

// Load queue management page
exports.loadQueue = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's appointments grouped by staff
        const appointments = await Appointment.find({
            date: { $gte: today, $lt: tomorrow },
            status: { $in: ['approved', 'in-progress'] }
        })
        .populate('customer')
        .populate('service')
        .populate('staff')
        .sort({ 'timeSlot.start': 1 });

        // Format times and group by staff
        const queueByStaff = {};
        const unassigned = [];

        appointments.forEach(apt => {
            const aptObj = apt.toObject();
            aptObj.timeSlot.startFormatted = formatTime12Hour(aptObj.timeSlot.start);
            aptObj.timeSlot.endFormatted = formatTime12Hour(aptObj.timeSlot.end);
            
            if (apt.staff) {
                const staffId = apt.staff._id.toString();
                if (!queueByStaff[staffId]) {
                    queueByStaff[staffId] = {
                        staff: apt.staff,
                        appointments: []
                    };
                }
                queueByStaff[staffId].appointments.push(aptObj);
            } else {
                unassigned.push(aptObj);
            }
        });

        const staff = await Staff.find({ isActive: true });
        const services = await Service.find({ isActive: true });

        res.render('admin/queue', { 
            queueByStaff: Object.values(queueByStaff),
            unassigned,
            staff,
            services
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading queue' });
    }
};

// Start serving (change status to in-progress)
exports.startServing = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        await Appointment.findByIdAndUpdate(appointmentId, { status: 'in-progress' });
        
        // Send "ready to serve" notification
        const { sendReadyToServeNotification } = require('../../services/notificationService');
        await sendReadyToServeNotification(appointmentId);
        
        res.redirect('/admin/queue');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error updating status' });
    }
};

// Reorder queue
exports.reorderQueue = async (req, res) => {
    try {
        const { appointments } = req.body; // Array of { id, order }
        
        for (const apt of appointments) {
            await Appointment.findByIdAndUpdate(apt.id, {
                'timeSlot.start': apt.newTime
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error reordering queue' });
    }
};

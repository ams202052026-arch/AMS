const Appointment = require('../models/appointment');
const { formatTime12Hour } = require('../utils/timeFormat');

// Load appointment history
exports.loadHistory = async (req, res) => {
    try {
        const userId = req.session.userId;
        const appointments = await Appointment.find({ 
            customer: userId,
            status: { $in: ['completed', 'cancelled', 'no-show'] }
        })
        .populate('service')
        .populate('staff')
        .populate('businessId') // Populate business info
        .sort({ date: -1 });

        // Format times to 12-hour format
        const formattedAppointments = appointments.map(apt => {
            const aptObj = apt.toObject();
            aptObj.timeSlot.startFormatted = formatTime12Hour(aptObj.timeSlot.start);
            aptObj.timeSlot.endFormatted = formatTime12Hour(aptObj.timeSlot.end);
            return aptObj;
        });

        res.render('history', { appointments: formattedAppointments });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading history' });
    }
};

// Delete single history item
exports.deleteHistory = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { appointmentId } = req.params;

        // Verify ownership and that it's a history item
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            customer: userId,
            status: { $in: ['completed', 'cancelled', 'no-show'] }
        });

        if (!appointment) {
            return res.status(404).json({ error: 'History item not found' });
        }

        await Appointment.findByIdAndDelete(appointmentId);
        console.log(`✅ History deleted: ${appointment.queueNumber} by user ${userId}`);

        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting history:', error);
        res.status(500).json({ error: 'Error deleting history' });
    }
};

// Clear all history
exports.clearAllHistory = async (req, res) => {
    try {
        const userId = req.session.userId;

        const result = await Appointment.deleteMany({
            customer: userId,
            status: { $in: ['completed', 'cancelled', 'no-show'] }
        });

        console.log(`✅ Cleared ${result.deletedCount} history items for user ${userId}`);

        res.json({ success: true, deletedCount: result.deletedCount });
    } catch (error) {
        console.error('❌ Error clearing history:', error);
        res.status(500).json({ error: 'Error clearing history' });
    }
};

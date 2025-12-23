const Service = require('../models/service');
const Staff = require('../models/staff');

// Get all services (for home page)
exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.find({ isActive: true })
            .populate('assignedStaff');
        res.json({ services });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching services' });
    }
};

// Get service details
exports.getServiceDetails = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const service = await Service.findById(serviceId)
            .populate('assignedStaff');
        
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.json({ service });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching service' });
    }
};

// Helper function to convert 24-hour time to 12-hour format
const formatTime12Hour = (time24) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
};

// Helper function to add minutes to a time string
const addMinutesToTime = (timeStr, minutes) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

// Helper function to check if a time range overlaps with booked appointments
const isTimeRangeAvailable = (startTime, endTime, bookedAppointments) => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    for (const apt of bookedAppointments) {
        const aptStart = timeToMinutes(apt.timeSlot.start);
        const aptEnd = timeToMinutes(apt.timeSlot.end);
        
        // Check if there's any overlap
        if (startMinutes < aptEnd && endMinutes > aptStart) {
            return false;
        }
    }
    return true;
};

// Helper function to convert time string to minutes
const timeToMinutes = (timeStr) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    return hours * 60 + mins;
};

// Get available time slots for a service/staff/date
exports.getAvailableSlots = async (req, res) => {
    try {
        const { serviceId, staffId, date } = req.query;
        const Appointment = require('../models/appointment');
        const Business = require('../models/business');
        
        console.log('Getting slots for:', { serviceId, staffId, date });

        // Get service to determine duration and business
        const service = await Service.findById(serviceId).populate('businessId');
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        const serviceDuration = service.duration; // in minutes
        console.log('Service duration:', serviceDuration, 'minutes');

        // Get the day of the week
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        console.log('Day of week:', dayOfWeek);

        // Staff selection is now required
        if (!staffId) {
            return res.status(400).json({ error: 'Staff selection is required' });
        }

        // Get staff availability
        const staff = await Staff.findById(staffId);
        if (!staff) {
            return res.status(404).json({ error: 'Staff not found' });
        }
        
        if (!staff.isActive) {
            return res.json({ slots: [], message: 'Staff is currently unavailable' });
        }

        // Get business and check business hours
        const business = await Business.findById(service.businessId);
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        console.log('Business found:', business.businessName);

        // Check if business can accept bookings
        if (!business.canAcceptBookings()) {
            console.log('Business cannot accept bookings');
            return res.json({ slots: [], message: 'Business is currently not accepting bookings' });
        }

        // Check if business is temporarily closed
        if (business.isTemporarilyClosed()) {
            console.log('Business is temporarily closed');
            return res.json({ 
                slots: [], 
                message: `Business is temporarily closed: ${business.temporaryClosureReason}` 
            });
        }

        // Get business hours for this day
        const businessHours = business.getHoursForDay(dayOfWeek);
        console.log('Business hours for', dayOfWeek + ':', businessHours);

        if (!businessHours || !businessHours.isOpen) {
            console.log('Business is closed on', dayOfWeek);
            return res.json({ 
                slots: [], 
                message: `Business is closed on ${dayOfWeek}s` 
            });
        }

        // Use business hours as the base operating hours
        let startHour = parseInt(businessHours.openTime.split(':')[0]);
        let startMinute = parseInt(businessHours.openTime.split(':')[1]);
        let endHour = parseInt(businessHours.closeTime.split(':')[0]);
        let endMinute = parseInt(businessHours.closeTime.split(':')[1]);

        console.log('Business hours:', businessHours.openTime, 'to', businessHours.closeTime);

        // Check staff availability and further restrict if needed
        if (staff.availability && staff.availability[dayOfWeek.toLowerCase()]) {
            const avail = staff.availability[dayOfWeek.toLowerCase()];
            console.log('Staff availability for day:', avail);
            
            if (!avail.isAvailable) {
                console.log('Staff not available on this day');
                return res.json({ slots: [], message: 'Staff is not available on this day' });
            }
            
            // Use the more restrictive hours between business and staff
            if (avail.start) {
                const staffStartHour = parseInt(avail.start.split(':')[0]);
                const staffStartMinute = parseInt(avail.start.split(':')[1]);
                if (staffStartHour > startHour || (staffStartHour === startHour && staffStartMinute > startMinute)) {
                    startHour = staffStartHour;
                    startMinute = staffStartMinute;
                }
            }
            if (avail.end) {
                const staffEndHour = parseInt(avail.end.split(':')[0]);
                const staffEndMinute = parseInt(avail.end.split(':')[1]);
                if (staffEndHour < endHour || (staffEndHour === endHour && staffEndMinute < endMinute)) {
                    endHour = staffEndHour;
                    endMinute = staffEndMinute;
                }
            }
        }

        console.log('Final operating hours:', `${startHour}:${String(startMinute).padStart(2, '0')}`, 'to', `${endHour}:${String(endMinute).padStart(2, '0')}`);

        // Generate slots based on service duration
        const allSlots = [];
        // Use service duration as interval, but minimum 10 minutes for reasonable granularity
        const slotInterval = Math.max(10, serviceDuration);
        
        console.log('Slot interval:', slotInterval, 'minutes');
        
        // Generate slots by iterating through minutes
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        
        for (let currentMinutes = startMinutes; currentMinutes < endMinutes; currentMinutes += slotInterval) {
            const slotStartHour = Math.floor(currentMinutes / 60);
            const slotStartMin = currentMinutes % 60;
            const slotStart = `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}`;
            const slotEnd = addMinutesToTime(slotStart, serviceDuration);
            
            // Check if slot end time is within business hours
            const slotEndMinutes = timeToMinutes(slotEnd);
            
            if (slotEndMinutes <= endMinutes) {
                allSlots.push({
                    start: slotStart,
                    end: slotEnd,
                    display: `${formatTime12Hour(slotStart)} - ${formatTime12Hour(slotEnd)}`
                });
            }
        }

        // Check for existing appointments on this date
        const selectedDate = new Date(date);
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Get appointments for this specific staff on this date
        const bookedAppointments = await Appointment.find({
            staff: staffId,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['pending', 'approved', 'in-progress'] }
        });

        console.log('Found', bookedAppointments.length, 'existing appointments for this staff');

        // Filter out slots that overlap with booked appointments
        const availableSlots = allSlots.filter(slot => 
            isTimeRangeAvailable(slot.start, slot.end, bookedAppointments)
        );

        console.log('Generated', allSlots.length, 'total slots');
        console.log('Available slots:', availableSlots.length);

        res.json({ slots: availableSlots });
    } catch (error) {
        console.error('❌ ERROR in getAvailableSlots:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Error fetching slots', message: error.message });
    }
};

/**
 * Get business availability for a specific date
 * Used by customer booking page to check if business is open
 */
exports.getBusinessAvailability = async (req, res) => {
    try {
        const { businessId, date } = req.query;
        
        if (!businessId || !date) {
            return res.status(400).json({ 
                available: false,
                error: 'Missing businessId or date parameter' 
            });
        }

        const Business = require('../models/business');
        const business = await Business.findById(businessId);
        
        if (!business) {
            return res.status(404).json({ 
                available: false,
                error: 'Business not found' 
            });
        }

        const bookingDate = new Date(date);
        const dayName = bookingDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Check if business can accept bookings
        if (!business.canAcceptBookings()) {
            return res.json({
                available: false,
                reason: 'Business is currently not accepting bookings'
            });
        }

        // Check if temporarily closed
        if (business.isTemporarilyClosed()) {
            return res.json({
                available: false,
                reason: `Business is temporarily closed: ${business.temporaryClosureReason}`,
                closedUntil: business.temporaryClosureUntil
            });
        }

        // Get business hours for the day
        const dayHours = business.getHoursForDay(dayName);
        
        if (!dayHours || !dayHours.isOpen) {
            return res.json({
                available: false,
                reason: `Business is closed on ${dayName}s`
            });
        }

        res.json({
            available: true,
            businessHours: {
                day: dayName,
                openTime: dayHours.openTime,
                closeTime: dayHours.closeTime
            }
        });
    } catch (error) {
        console.error('Error checking business availability:', error);
        res.status(500).json({ 
            available: false,
            error: 'Error checking business availability' 
        });
    }
};

const Appointment = require('../models/appointment');
const Service = require('../models/service');
const Staff = require('../models/staff');
const User = require('../models/user');
const Notification = require('../models/notification');
const { formatTime12Hour } = require('../utils/timeFormat');

// Load appointments page
exports.loadAppointments = async (req, res) => {
    try {
        const userId = req.session.userId;
        const appointments = await Appointment.find({ 
            customer: userId,
            status: { $in: ['pending', 'approved', 'confirmed', 'in-progress'] }
        })
        .populate('service')
        .populate('staff')
        .populate('businessId') // Populate business info
        .sort({ date: 1 });

        // Format times to 12-hour format
        const formattedAppointments = appointments.map(apt => {
            const aptObj = apt.toObject();
            aptObj.timeSlot.startFormatted = formatTime12Hour(aptObj.timeSlot.start);
            aptObj.timeSlot.endFormatted = formatTime12Hour(aptObj.timeSlot.end);
            return aptObj;
        });

        res.render('appointments', { appointments: formattedAppointments });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading appointments' });
    }
};

// Load booking page for a service
exports.loadBookingPage = async (req, res) => {
    try {
        const userId = req.session.userId;
        const serviceId = req.params.serviceId;
        const service = await Service.findById(serviceId)
            .populate('assignedStaff')
            .populate('businessId'); // Populate business info
        
        if (!service) {
            return res.status(404).render('error', { message: 'Service not found' });
        }

        // Check if user is trying to book their own business service
        if (service.businessId && service.businessId.ownerId && 
            service.businessId.ownerId.toString() === userId.toString()) {
            console.log('❌ BLOCKED: User trying to access booking page for their own business');
            return res.status(403).render('error', { 
                message: 'You cannot book your own business services. Please use a different account to make bookings.' 
            });
        }

        const availableStaff = await Staff.find({
            _id: { $in: service.assignedStaff },
            isActive: true
        });

        // Get customer's active redemptions
        const { Redemption } = require('../models/reward');
        const activeRedemptions = await Redemption.find({
            customer: userId,
            status: 'active'
        }).populate('reward');

        // Filter active redemptions
        const applicableRedemptions = activeRedemptions.filter(redemption => {
            const reward = redemption.reward;
            // Only show active rewards
            return reward && reward.isActive;
        });

        res.render('booking', { service, availableStaff, applicableRedemptions });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading booking page' });
    }
};

// Create new appointment
exports.createAppointment = async (req, res) => {
    try {
        // Helper function - define at the top to avoid hoisting issues
        const timeToMinutes = (timeStr) => {
            const [hours, mins] = timeStr.split(':').map(Number);
            return hours * 60 + mins;
        };

        const userId = req.session.userId;
        const { serviceId, staffId, date, startTime, endTime, notes, redemptionId } = req.body;

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 NEW BOOKING REQUEST');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('User ID:', userId);
        console.log('Service ID:', serviceId);
        console.log('Staff ID:', staffId || 'Not selected');
        console.log('Date:', date);
        console.log('Start Time:', startTime);
        console.log('End Time:', endTime);
        console.log('Notes:', notes || 'None');
        console.log('Session:', req.session);

        if (!userId) {
            console.error('❌ ERROR: No user ID in session');
            console.log('Session data:', req.session);
            return res.redirect('/login');
        }

        if (!serviceId || !staffId || !date || !startTime || !endTime) {
            console.error('❌ ERROR: Missing required fields');
            console.log('Missing:', {
                serviceId: !serviceId,
                staffId: !staffId,
                date: !date,
                startTime: !startTime,
                endTime: !endTime
            });
            
            const errorMsg = 'Missing required booking information. Please select staff, date, and time.';
            // Check if request expects JSON
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
                return res.status(400).json({ error: errorMsg });
            }
            return res.status(400).render('error', { message: errorMsg });
        }

        // ========================================
        // COMPREHENSIVE BOOKING VALIDATIONS
        // ========================================

        const bookingDate = new Date(date);
        const now = new Date();

        // Helper function to return error
        const returnError = (message) => {
            console.error('❌ VALIDATION ERROR:', message);
            // Always return JSON for AJAX requests
            return res.status(400).json({ error: message });
        };

        // 1. PAST DATE PREVENTION
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const bookingDateOnly = new Date(bookingDate);
        bookingDateOnly.setHours(0, 0, 0, 0);
        
        if (bookingDateOnly < today) {
            return returnError('Cannot book appointments in the past. Please select today or a future date.');
        }

        // 2. TOO FAR IN ADVANCE (Max 30 days)
        const maxDaysAhead = 30;
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + maxDaysAhead);
        
        if (bookingDateOnly > maxDate) {
            return returnError(`Bookings can only be made up to ${maxDaysAhead} days in advance. Please select a date within the next month.`);
        }

        // 3. SERVICE ACTIVE CHECK (moved up to get minAdvanceBookingHours)
        const service = await Service.findById(serviceId).populate('businessId');
        if (!service) {
            return returnError('Service not found. Please select a valid service.');
        }
        if (!service.isActive) {
            return returnError(`${service.name} is currently unavailable. Please choose a different service.`);
        }

        // 3.1. BUSINESS OWNER CANNOT BOOK OWN SERVICE
        const business = service.businessId;
        
        console.log('🔍 Checking business owner...');
        console.log('   Business Owner ID:', business.ownerId);
        console.log('   Current User ID:', userId);
        console.log('   Are they equal?', business.ownerId.toString() === userId.toString());
        
        if (business.ownerId && business.ownerId.toString() === userId.toString()) {
            console.log('❌ BLOCKED: User is trying to book their own business service');
            return returnError('You cannot book your own business services. Please use a different account to make bookings.');
        }

        // 3.2. BUSINESS HOURS AND AVAILABILITY CHECK
        
        // Check if business can accept bookings
        if (!business.canAcceptBookings()) {
            return returnError('This business is currently not accepting bookings.');
        }

        // Check if business is temporarily closed
        if (business.isTemporarilyClosed()) {
            const reason = business.temporaryClosureReason || 'temporarily closed';
            return returnError(`Business is ${reason}. Please try booking later.`);
        }

        // Check business hours for the booking day
        const dayName = bookingDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dayHours = business.getHoursForDay(dayName);
        
        if (!dayHours || !dayHours.isOpen) {
            return returnError(`${business.businessName} is closed on ${dayName}s. Please select a different date.`);
        }

        // Check if booking time is within business hours
        const bookingStartMinutes = timeToMinutes(startTime);
        const bookingEndMinutes = timeToMinutes(endTime);
        const businessOpenMinutes = timeToMinutes(dayHours.openTime);
        const businessCloseMinutes = timeToMinutes(dayHours.closeTime);
        
        if (bookingStartMinutes < businessOpenMinutes || bookingEndMinutes > businessCloseMinutes) {
            const { formatTime12Hour } = require('../utils/timeFormat');
            return returnError(`${business.businessName} is only open from ${formatTime12Hour(dayHours.openTime)} to ${formatTime12Hour(dayHours.closeTime)} on ${dayName}s. Please select a time within business hours.`);
        }

        // 4. MINIMUM BOOKING NOTICE (based on service setting)
        
        const bookingDateTime = new Date(bookingDate);
        const [startHour, startMin] = startTime.split(':').map(Number);
        bookingDateTime.setHours(startHour, startMin, 0, 0);
        
        // Calculate minimum notice in milliseconds based on unit
        if (service.minAdvanceBooking && service.minAdvanceBooking.value > 0) {
            const minValue = service.minAdvanceBooking.value;
            const minUnit = service.minAdvanceBooking.unit || 'hours';
            
            let minNoticeMs = 0;
            let timeText = '';
            
            switch (minUnit) {
                case 'minutes':
                    minNoticeMs = minValue * 60 * 1000;
                    timeText = minValue === 1 ? '1 minute' : `${minValue} minutes`;
                    break;
                case 'hours':
                    minNoticeMs = minValue * 60 * 60 * 1000;
                    timeText = minValue === 1 ? '1 hour' : `${minValue} hours`;
                    break;
                case 'days':
                    minNoticeMs = minValue * 24 * 60 * 60 * 1000;
                    timeText = minValue === 1 ? '1 day' : `${minValue} days`;
                    break;
            }
            
            const timeDiff = bookingDateTime - now;
            
            if (timeDiff < minNoticeMs) {
                return returnError(`${service.name} must be booked at least ${timeText} in advance. Please select a later time or date.`);
            }
        }
        // Calculate time in minutes (used in multiple validations below)
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);

        // 5. STAFF AVAILABILITY CHECK (required)
        const selectedStaff = await Staff.findById(staffId);
        if (!selectedStaff) {
            return returnError('Selected staff member not found.');
        }
        if (!selectedStaff.isActive) {
            return returnError(`${selectedStaff.name} is currently unavailable. Please select a different staff member.`);
        }
        
        // Check staff's day availability
        const dayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (selectedStaff.availability && selectedStaff.availability[dayOfWeek]) {
            const dayAvail = selectedStaff.availability[dayOfWeek];
            if (!dayAvail.isAvailable) {
                return returnError(`${selectedStaff.name} is not available on ${dayOfWeek}s. Please select a different date or staff member.`);
            }
            
            // Check if booking time is within staff's working hours
            const staffStartMinutes = dayAvail.start ? timeToMinutes(dayAvail.start) : 0;
            const staffEndMinutes = dayAvail.end ? timeToMinutes(dayAvail.end) : 24 * 60;
            
            if (startMinutes < staffStartMinutes || endMinutes > staffEndMinutes) {
                return returnError(`${selectedStaff.name} is only available from ${formatTime12Hour(dayAvail.start)} to ${formatTime12Hour(dayAvail.end)} on this day. Please select a time within their working hours.`);
            }
        }

        // 6. BUSINESS HOURS VALIDATION
        const businessStartHour = 8; // 8 AM
        const businessEndHour = 20; // 8 PM
        const businessStartMinutes = businessStartHour * 60;
        const businessEndMinutes = businessEndHour * 60;
        
        if (startMinutes < businessStartMinutes || endMinutes > businessEndMinutes) {
            return returnError(`Bookings are only available between ${businessStartHour}:00 AM and ${businessEndHour}:00 PM. Please select a time within business hours.`);
        }

        // 7. HOLIDAY/CLOSED DAYS CHECK
        const closedDays = ['sunday']; // Shop closed on Sundays
        const holidays = [
            '2025-12-25', // Christmas
            '2025-01-01', // New Year
            '2025-12-30', // Rizal Day
            // Add more holidays as needed
        ];
        
        const bookingDayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (closedDays.includes(bookingDayOfWeek)) {
            return returnError(`We are closed on ${bookingDayOfWeek}s. Please select a different date.`);
        }
        
        const bookingDateStr = bookingDate.toISOString().split('T')[0];
        if (holidays.includes(bookingDateStr)) {
            return returnError('We are closed on this holiday. Please select a different date.');
        }

        // Get existing appointments for validation
        const startOfDay = new Date(bookingDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(bookingDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAppointments = await Appointment.find({
            customer: userId,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['pending', 'approved', 'confirmed', 'in-progress'] }
        }).populate('service');

        // 8. MAXIMUM DAILY BOOKINGS (Max 3 appointments per day)
        const maxDailyBookings = 3;
        if (existingAppointments.length >= maxDailyBookings) {
            return returnError(`You have reached the maximum of ${maxDailyBookings} appointments per day. Please select a different date or cancel an existing appointment.`);
        }

        // ========================================
        // CONFLICT CHECKS
        // ========================================

        // Check if customer already booked the same service on this day
        const sameServiceBooking = existingAppointments.find(apt => 
            apt.service && apt.service._id.toString() === serviceId
        );

        if (sameServiceBooking) {
            console.error('❌ ERROR: Same service already booked on this day');
            console.log('   Service:', sameServiceBooking.service.name);
            console.log('   Existing time:', sameServiceBooking.timeSlot.start, '-', sameServiceBooking.timeSlot.end);
            
            const sameServiceMsg = `You already have a ${sameServiceBooking.status} appointment for ${sameServiceBooking.service.name} on this date at ${formatTime12Hour(sameServiceBooking.timeSlot.start)}. You cannot book the same service twice on the same day. Please choose a different date or cancel your existing appointment first.`;
            
            // Check if request expects JSON
            if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
                return res.status(400).json({ error: sameServiceMsg });
            }
            return res.status(400).render('error', { message: sameServiceMsg });
        }

        // Check if new booking conflicts with existing appointments (time overlap)
        const newStartMinutes = timeToMinutes(startTime);
        const newEndMinutes = timeToMinutes(endTime);

        for (const existing of existingAppointments) {
            const existingStart = timeToMinutes(existing.timeSlot.start);
            const existingEnd = timeToMinutes(existing.timeSlot.end);

            // Check for time overlap
            if (newStartMinutes < existingEnd && newEndMinutes > existingStart) {
                console.error('❌ ERROR: Time slot conflict detected');
                console.log('   Existing appointment:', existing.service.name);
                console.log('   Existing time:', existing.timeSlot.start, '-', existing.timeSlot.end);
                console.log('   New time:', startTime, '-', endTime);
                
                const conflictMsg = `You already have a ${existing.status} appointment (${existing.service.name}) scheduled from ${formatTime12Hour(existing.timeSlot.start)} to ${formatTime12Hour(existing.timeSlot.end)} on this date. Please choose a different time slot or cancel your existing appointment first.`;
                
                // Check if request expects JSON
                if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
                    return res.status(400).json({ error: conflictMsg });
                }
                return res.status(400).render('error', { message: conflictMsg });
            }
        }

        console.log('✅ No scheduling conflicts found');

        // Handle redemption if provided
        let discountApplied = 0;
        let finalPrice = service.price;
        let appliedRedemption = null;

        if (redemptionId) {
            const { Redemption } = require('../models/reward');
            const redemption = await Redemption.findOne({
                _id: redemptionId,
                customer: userId,
                status: 'active'
            }).populate('reward');

            if (!redemption || !redemption.reward) {
                const errorMsg = 'Invalid or unavailable reward selected.';
                if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
                    return res.status(400).json({ error: errorMsg });
                }
                return res.status(400).render('error', { message: errorMsg });
            }

            const reward = redemption.reward;
            
            // Calculate discount
            if (reward.discountType === 'percentage') {
                discountApplied = (service.price * reward.discountValue) / 100;
            } else if (reward.discountType === 'fixed') {
                discountApplied = Math.min(reward.discountValue, service.price);
            }
            
            finalPrice = Math.max(0, service.price - discountApplied);
            appliedRedemption = redemptionId;
            
            console.log('💰 Reward applied:', reward.name);
            console.log('   Original price: ₱' + service.price);
            console.log('   Discount: ₱' + discountApplied);
            console.log('   Final price: ₱' + finalPrice);
        }

        const appointment = new Appointment({
            customer: userId,
            service: serviceId,
            businessId: service.businessId, // Link to business
            staff: staffId || null,
            date: new Date(date),
            timeSlot: { start: startTime, end: endTime },
            notes: notes || '',
            appliedRedemption: appliedRedemption,
            discountApplied: discountApplied,
            finalPrice: finalPrice
        });

        await appointment.save();

        // Mark redemption as pending (locked to this appointment)
        if (redemptionId) {
            const { Redemption } = require('../models/reward');
            await Redemption.findByIdAndUpdate(redemptionId, {
                status: 'pending',
                appliedToAppointment: appointment._id
            });
            console.log('✅ Redemption marked as pending (locked to appointment)');
        }
        console.log('✅ SUCCESS: Appointment created!');
        console.log('   Queue Number:', appointment.queueNumber);
        console.log('   Status:', appointment.status);
        console.log('   ID:', appointment._id);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // No notification sent during booking - customer will be notified when business owner confirms
        console.log('📝 Note: Customer will be notified when business owner confirms the appointment');

        res.redirect('/appointments');
    } catch (error) {
        console.error('❌ ERROR creating appointment:', error);
        console.error('Stack:', error.stack);
        res.status(500).render('error', { message: 'Error creating appointment: ' + error.message });
    }
};

// Cancel appointment (customer)
exports.cancelAppointment = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { appointmentId } = req.params;

        const appointment = await Appointment.findOne({
            _id: appointmentId,
            customer: userId
        });

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        if (appointment.status === 'completed' || appointment.status === 'cancelled') {
            return res.status(400).json({ error: 'Cannot cancel this appointment' });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        // No notification when customer cancels their own appointment

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error cancelling appointment' });
    }
};

// Reschedule appointment (customer - only for pending appointments)
exports.requestReschedule = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { appointmentId } = req.params;
        const { newDate, newStartTime, newEndTime } = req.body;

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔄 RESCHEDULE REQUEST');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const appointment = await Appointment.findOne({
            _id: appointmentId,
            customer: userId
        }).populate('service');

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // Only pending appointments can be rescheduled
        if (appointment.status !== 'pending') {
            return res.status(400).json({ 
                error: `Cannot reschedule ${appointment.status} appointments. Only pending appointments can be rescheduled. Please cancel and create a new booking instead.` 
            });
        }

        if (!newDate || !newStartTime || !newEndTime) {
            return res.status(400).json({ error: 'Missing required reschedule information' });
        }

        // Run all the same validations as new bookings
        const bookingDate = new Date(newDate);
        const now = new Date();

        const returnError = (message) => {
            console.error('❌ RESCHEDULE VALIDATION ERROR:', message);
            return res.status(400).json({ error: message });
        };

        // Reuse validation logic (same as createAppointment)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const bookingDateOnly = new Date(bookingDate);
        bookingDateOnly.setHours(0, 0, 0, 0);
        
        if (bookingDateOnly < today) {
            return returnError('Cannot reschedule to a past date.');
        }

        const maxDaysAhead = 30;
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + maxDaysAhead);
        
        if (bookingDateOnly > maxDate) {
            return returnError(`Can only reschedule up to ${maxDaysAhead} days in advance.`);
        }

        const timeToMinutes = (timeStr) => {
            const [hours, mins] = timeStr.split(':').map(Number);
            return hours * 60 + mins;
        };

        const bookingDateTime = new Date(bookingDate);
        const [startHour, startMin] = newStartTime.split(':').map(Number);
        bookingDateTime.setHours(startHour, startMin, 0, 0);
        
        const minNoticeHours = 2;
        const minNoticeMs = minNoticeHours * 60 * 60 * 1000;
        const timeDiff = bookingDateTime - now;
        
        if (timeDiff < minNoticeMs) {
            return returnError(`Must reschedule at least ${minNoticeHours} hours in advance.`);
        }

        // Check closed days
        const closedDays = ['sunday'];
        const bookingDayOfWeek = bookingDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        if (closedDays.includes(bookingDayOfWeek)) {
            return returnError(`We are closed on ${bookingDayOfWeek}s.`);
        }

        // Check for conflicts (excluding current appointment)
        const startOfDay = new Date(bookingDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(bookingDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAppointments = await Appointment.find({
            _id: { $ne: appointmentId }, // Exclude current appointment
            customer: userId,
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['pending', 'approved', 'confirmed', 'in-progress'] }
        }).populate('service');

        // Check same service
        const sameServiceBooking = existingAppointments.find(apt => 
            apt.service && apt.service._id.toString() === appointment.service._id.toString()
        );

        if (sameServiceBooking) {
            return returnError(`You already have another appointment for ${appointment.service.name} on this date.`);
        }

        // Check time conflicts
        const newStartMinutes = timeToMinutes(newStartTime);
        const newEndMinutes = timeToMinutes(newEndTime);

        for (const existing of existingAppointments) {
            const existingStart = timeToMinutes(existing.timeSlot.start);
            const existingEnd = timeToMinutes(existing.timeSlot.end);

            if (newStartMinutes < existingEnd && newEndMinutes > existingStart) {
                return returnError(`Time conflict with your ${existing.service.name} appointment at ${formatTime12Hour(existing.timeSlot.start)}.`);
            }
        }

        // Update appointment
        appointment.date = new Date(newDate);
        appointment.timeSlot = { start: newStartTime, end: newEndTime };
        await appointment.save();

        console.log('✅ SUCCESS: Appointment rescheduled!');
        console.log('   New Date:', newDate);
        console.log('   New Time:', newStartTime, '-', newEndTime);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Send reschedule confirmation notification
        try {
            console.log('📧 Attempting to send reschedule notification...');
            
            // Create proper reschedule notification
            const { formatTime12Hour } = require('../utils/timeFormat');
            
            // Get staff name safely
            let rescheduleStaffName = 'Any Available';
            if (appointment.staff) {
                if (typeof appointment.staff === 'object' && appointment.staff.name) {
                    rescheduleStaffName = appointment.staff.name;
                } else {
                    // Staff is just an ID, need to populate
                    const staffDoc = await Staff.findById(appointment.staff);
                    if (staffDoc) rescheduleStaffName = staffDoc.name;
                }
            }
            
            // Format dates and times properly
            const formattedDate = new Date(newDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            const formattedStartTime = formatTime12Hour(newStartTime);
            const formattedEndTime = formatTime12Hour(newEndTime);
            
            console.log('   Service:', appointment.service.name);
            console.log('   Staff:', rescheduleStaffName);
            console.log('   Customer:', userId);
            
            await Notification.create({
                customer: userId,
                title: 'Appointment Rescheduled',
                message: `Your appointment has been rescheduled successfully!\n\nService: ${appointment.service.name}\nNew Date: ${formattedDate}\nNew Time: ${formattedStartTime} - ${formattedEndTime}\nStaff: ${rescheduleStaffName}\nQueue Number: ${appointment.queueNumber}\n\nWe look forward to seeing you at your new appointment time!`,
                type: 'appointment_update',
                meta: {
                    appointmentId: appointment._id,
                    queueNumber: appointment.queueNumber,
                    oldDate: appointment.date,
                    newDate: newDate
                }
            });
            console.log('✅ Reschedule notification sent successfully');
        } catch (notifError) {
            console.error('⚠️ Failed to send reschedule notification:', notifError.message);
            console.error('   Full error:', notifError);
            // Continue anyway - reschedule was successful
        }

        res.json({ success: true });
    } catch (error) {
        console.error('❌ ERROR rescheduling appointment:', error);
        res.status(500).json({ error: 'Error rescheduling appointment' });
    }
};

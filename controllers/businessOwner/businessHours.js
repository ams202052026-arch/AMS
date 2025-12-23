/**
 * Business Hours Management Controller
 * Handles business hours and operations management for business owners
 */

const Business = require('../../models/business');
const User = require('../../models/user');

/**
 * Load business hours management page
 */
exports.loadBusinessHours = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        console.log('\n=== LOADING BUSINESS HOURS PAGE ===');
        console.log('User ID:', userId);
        console.log('Session data:', {
            userId: req.session.userId,
            userRole: req.session.userRole,
            currentMode: req.session.currentMode
        });
        
        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            console.log('❌ Business not found for user:', userId);
            return res.redirect('/business/register');
        }

        console.log('✅ Business found:', business.businessName);
        console.log('Current business hours in DB:', business.businessHours.length, 'entries');

        // Get user data
        const user = await User.findById(userId);

        // Ensure all days are present in businessHours
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const businessHours = [];

        daysOfWeek.forEach(day => {
            const existingHour = business.businessHours.find(bh => bh.day === day);
            if (existingHour) {
                // Ensure times have default values even if empty
                const hourData = {
                    day: existingHour.day,
                    isOpen: existingHour.isOpen,
                    openTime: existingHour.openTime || '09:00',
                    closeTime: existingHour.closeTime || '18:00',
                    _id: existingHour._id
                };
                console.log(`${day}: Using saved hours - ${hourData.isOpen ? `${hourData.openTime}-${hourData.closeTime}` : 'Closed'}`);
                businessHours.push(hourData);
            } else {
                // Default hours: 9 AM to 6 PM, open Monday-Saturday, closed Sunday
                const defaultHour = {
                    day: day,
                    isOpen: day !== 'Sunday',
                    openTime: '09:00',
                    closeTime: '18:00'
                };
                console.log(`${day}: Using default hours - ${defaultHour.isOpen ? `${defaultHour.openTime}-${defaultHour.closeTime}` : 'Closed'}`);
                businessHours.push(defaultHour);
            }
        });

        console.log('Final business hours to render:', businessHours.length, 'entries');
        console.log('=== LOAD COMPLETE ===\n');

        res.render('businessOwner/businessHours', { 
            business,
            user,
            businessHours
        });
    } catch (error) {
        console.error('❌ Error loading business hours:', error);
        console.error('Stack:', error.stack);
        res.status(500).render('error', { 
            title: 'Error Loading Business Hours',
            message: 'Error loading business hours management',
            statusCode: 500
        });
    }
};

/**
 * Update business hours
 */
exports.updateBusinessHours = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { businessHours } = req.body;

        console.log('\n=== BUSINESS HOURS UPDATE REQUEST ===');
        console.log('User ID:', userId);
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            console.log('❌ Business not found for user:', userId);
            return res.status(404).json({ error: 'Business not found' });
        }

        console.log('✅ Business found:', business.businessName);

        // Validate and format business hours
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const updatedHours = [];

        daysOfWeek.forEach(day => {
            const dayData = businessHours[day.toLowerCase()];
            console.log(`Processing ${day}:`, dayData);
            if (dayData) {
                // Handle boolean, string "true"/"false", or "on" from checkboxes
                let isOpen = false;
                if (typeof dayData.isOpen === 'boolean') {
                    isOpen = dayData.isOpen;
                } else if (typeof dayData.isOpen === 'string') {
                    isOpen = dayData.isOpen === 'true' || dayData.isOpen === 'on';
                }
                
                console.log(`  isOpen value: ${dayData.isOpen} (type: ${typeof dayData.isOpen}) -> ${isOpen}`);
                
                updatedHours.push({
                    day: day,
                    isOpen: isOpen,
                    openTime: isOpen ? (dayData.openTime || '09:00') : '09:00',
                    closeTime: isOpen ? (dayData.closeTime || '18:00') : '18:00'
                });
            }
        });

        console.log('Updated hours to save:', updatedHours);

        // Update business hours
        business.businessHours = updatedHours;
        await business.save();

        console.log('✅ Business hours updated successfully for:', business.businessName);
        console.log('=== UPDATE COMPLETE ===\n');
        
        res.json({ success: true, message: 'Business hours updated successfully' });
    } catch (error) {
        console.error('❌ Error updating business hours:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({ error: 'Error updating business hours' });
    }
};

/**
 * Toggle business operations (open/close business)
 */
exports.toggleBusinessOperations = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { isCurrentlyOpen, temporaryClosureReason, temporaryClosureHours } = req.body;

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Update business operations status
        business.isCurrentlyOpen = isCurrentlyOpen === 'true' || isCurrentlyOpen === true;
        
        if (!business.isCurrentlyOpen) {
            business.temporaryClosureReason = temporaryClosureReason || 'Temporarily closed';
            
            // Set closure duration if provided
            if (temporaryClosureHours && temporaryClosureHours > 0) {
                const closureUntil = new Date();
                closureUntil.setHours(closureUntil.getHours() + parseInt(temporaryClosureHours));
                business.temporaryClosureUntil = closureUntil;
            } else {
                business.temporaryClosureUntil = null;
            }
        } else {
            // Clear temporary closure data when reopening
            business.temporaryClosureReason = null;
            business.temporaryClosureUntil = null;
        }

        await business.save();

        const statusMessage = business.isCurrentlyOpen ? 'opened' : 'closed';
        console.log(`✓ Business ${statusMessage}:`, business.businessName);
        
        res.json({ 
            success: true, 
            message: `Business ${statusMessage} successfully`,
            isCurrentlyOpen: business.isCurrentlyOpen,
            temporaryClosureReason: business.temporaryClosureReason,
            temporaryClosureUntil: business.temporaryClosureUntil
        });
    } catch (error) {
        console.error('Error toggling business operations:', error);
        res.status(500).json({ error: 'Error updating business operations' });
    }
};

/**
 * Get business availability for a specific date (API endpoint for customer booking)
 */
exports.getBusinessAvailability = async (req, res) => {
    try {
        const { businessId, date } = req.query;

        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
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
        res.status(500).json({ error: 'Error checking business availability' });
    }
};
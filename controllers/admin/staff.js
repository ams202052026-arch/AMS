const Staff = require('../../models/staff');

// List all staff
exports.listStaff = async (req, res) => {
    try {
        const staff = await Staff.find();
        res.render('admin/staff/list', { staff });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading staff' });
    }
};

// Load add staff form
exports.loadAddForm = async (req, res) => {
    try {
        res.render('admin/staff/form', { staff: null, error: null });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading form' });
    }
};

// Add new staff
exports.addStaff = async (req, res) => {
    try {
        const { name, email, phone, specialties, availability } = req.body;
        
        // Check for duplicate email
        if (email) {
            const existingEmail = await Staff.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                return res.render('admin/staff/form', { 
                    staff: null,
                    error: 'Email already exists. Please use a different email address.'
                });
            }
        }

        // Check for duplicate phone
        if (phone) {
            const existingPhone = await Staff.findOne({ phone: phone.trim() });
            if (existingPhone) {
                return res.render('admin/staff/form', { 
                    staff: null,
                    error: 'Phone number already exists. Please use a different phone number.'
                });
            }
        }

        // Parse specialties from form (comes as array from specialties[])
        let specialtiesArray = [];
        if (specialties) {
            // If it's already an array, use it; otherwise convert to array
            specialtiesArray = Array.isArray(specialties) ? specialties : [specialties];
            // Clean up: trim and filter empty values
            specialtiesArray = specialtiesArray
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }

        const staff = new Staff({
            name,
            email: email.toLowerCase(),
            phone: phone ? phone.trim() : '',
            specialties: specialtiesArray,
            availability: availability || {}
        });

        await staff.save();
        console.log('✓ Staff created:', staff.name, 'with specialties:', specialtiesArray);

        res.redirect('/admin/staff');
    } catch (error) {
        console.error('Error adding staff:', error);
        
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.render('admin/staff/form', { 
                staff: null,
                error: `This ${field} is already in use. Please use a different ${field}.` 
            });
        }
        
        res.status(500).render('error', { message: 'Error adding staff: ' + error.message });
    }
};

// Load edit staff form
exports.loadEditForm = async (req, res) => {
    try {
        const { staffId } = req.params;
        const staff = await Staff.findById(staffId);
        res.render('admin/staff/form', { staff, error: null });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading form' });
    }
};

// Update staff
exports.updateStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { name, email, phone, specialties, availability, isActive } = req.body;

        // Get current staff data for re-rendering form if error
        const currentStaff = await Staff.findById(staffId);

        // Check for duplicate email (excluding current staff)
        if (email) {
            const existingEmail = await Staff.findOne({ 
                email: email.toLowerCase(),
                _id: { $ne: staffId }
            });
            if (existingEmail) {
                return res.render('admin/staff/form', { 
                    staff: currentStaff,
                    error: 'Email already exists. Please use a different email address.'
                });
            }
        }

        // Check for duplicate phone (excluding current staff)
        if (phone) {
            const existingPhone = await Staff.findOne({ 
                phone: phone.trim(),
                _id: { $ne: staffId }
            });
            if (existingPhone) {
                return res.render('admin/staff/form', { 
                    staff: currentStaff,
                    error: 'Phone number already exists. Please use a different phone number.'
                });
            }
        }

        // Parse specialties from form (comes as array from specialties[])
        let specialtiesArray = [];
        if (specialties) {
            // If it's already an array, use it; otherwise convert to array
            specialtiesArray = Array.isArray(specialties) ? specialties : [specialties];
            // Clean up: trim and filter empty values
            specialtiesArray = specialtiesArray
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }

        await Staff.findByIdAndUpdate(staffId, {
            name,
            email: email.toLowerCase(),
            phone: phone ? phone.trim() : '',
            specialties: specialtiesArray,
            availability: availability || {},
            isActive: isActive === 'true'
        });

        console.log('✓ Staff updated:', name);
        res.redirect('/admin/staff');
    } catch (error) {
        console.error('Error updating staff:', error);
        
        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.render('admin/staff/form', { 
                staff: currentStaff,
                error: `This ${field} is already in use. Please use a different ${field}.` 
            });
        }
        
        res.status(500).render('error', { message: 'Error updating staff: ' + error.message });
    }
};

// Deactivate staff
exports.deactivateStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        await Staff.findByIdAndUpdate(staffId, { isActive: false });
        res.redirect('/admin/staff');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error deactivating staff' });
    }
};

// Check if staff has active appointments
exports.checkAppointments = async (req, res) => {
    try {
        const { staffId } = req.params;
        const Appointment = require('../../models/appointment');

        // Find active appointments for this staff
        const appointments = await Appointment.find({
            staff: staffId,
            status: { $in: ['pending', 'approved', 'in-progress'] }
        })
        .populate('customer')
        .populate('service')
        .sort({ date: 1 });

        const hasAppointments = appointments.length > 0;

        // Format appointment data for display
        const appointmentData = appointments.map(apt => ({
            queueNumber: apt.queueNumber,
            customerName: apt.customer ? apt.customer.name : 'Unknown',
            serviceName: apt.service ? apt.service.name : 'Unknown',
            date: apt.date,
            status: apt.status
        }));

        res.json({
            hasAppointments,
            count: appointments.length,
            appointments: appointmentData
        });
    } catch (error) {
        console.error('Error checking appointments:', error);
        res.status(500).json({ error: 'Error checking appointments' });
    }
};

// Delete staff
exports.deleteStaff = async (req, res) => {
    try {
        const { staffId } = req.params;
        const Appointment = require('../../models/appointment');

        // Double-check for active appointments before deleting
        const activeAppointments = await Appointment.countDocuments({
            staff: staffId,
            status: { $in: ['pending', 'approved', 'in-progress'] }
        });

        if (activeAppointments > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete staff with active appointments' 
            });
        }

        // Delete the staff
        await Staff.findByIdAndDelete(staffId);
        console.log('✓ Staff deleted:', staffId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ error: 'Error deleting staff' });
    }
};

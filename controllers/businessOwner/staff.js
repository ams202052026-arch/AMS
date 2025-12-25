/**
 * Business Owner Staff Controller
 * Handles staff management for business owners
 */

const Staff = require('../../models/staff');
const Business = require('../../models/business');
const User = require('../../models/user');

/**
 * List all staff for the business
 */
exports.listStaff = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Get staff for this business
        const staff = await Staff.find({ businessId: business._id })
            .sort({ createdAt: -1 });

        // Get user data
        const user = await User.findById(userId);

        res.render('businessOwner/staff/list', { 
            staff, 
            business,
            user 
        });
    } catch (error) {
        console.error('Error loading staff:', error);
        res.status(500).render('error', { message: 'Error loading staff' });
    }
};

/**
 * Load add staff form
 */
exports.loadAddForm = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Get user data
        const user = await User.findById(userId);

        res.render('businessOwner/staff/form', { 
            staff: null, 
            business,
            user,
            error: null 
        });
    } catch (error) {
        console.error('Error loading add form:', error);
        res.status(500).render('error', { message: 'Error loading form' });
    }
};

/**
 * Add new staff
 */
exports.addStaff = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { name, email, phone } = req.body;
        
        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Check for duplicate email
        if (email) {
            const existingEmail = await Staff.findOne({ email: email.toLowerCase() });
            if (existingEmail) {
                const user = await User.findById(userId);
                return res.render('businessOwner/staff/form', { 
                    staff: null,
                    business,
                    user,
                    error: 'Email already exists. Please use a different email address.'
                });
            }
        }

        // Check for duplicate phone
        if (phone) {
            const existingPhone = await Staff.findOne({ phone: phone.trim() });
            if (existingPhone) {
                const user = await User.findById(userId);
                return res.render('businessOwner/staff/form', { 
                    staff: null,
                    business,
                    user,
                    error: 'Phone number already exists. Please use a different phone number.'
                });
            }
        }

        const staff = new Staff({
            name,
            email: email.toLowerCase(),
            phone: phone ? phone.trim() : '',
            businessId: business._id // Associate with business
        });

        await staff.save();
        console.log('✓ Staff created:', staff.name, 'for business:', business.businessName);

        res.redirect('/business-owner/staff');
    } catch (error) {
        console.error('Error adding staff:', error);
        
        // Get data for re-rendering form
        const userId = req.session.userId;
        const business = await Business.findOne({ ownerId: userId });
        const user = await User.findById(userId);

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.render('businessOwner/staff/form', { 
                staff: null,
                business,
                user,
                error: `This ${field} is already in use. Please use a different ${field}.` 
            });
        }
        
        res.render('businessOwner/staff/form', { 
            staff: null, 
            business,
            user,
            error: 'Error adding staff: ' + error.message 
        });
    }
};

/**
 * Load edit staff form
 */
exports.loadEditForm = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { staffId } = req.params;
        
        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Get staff (ensure it belongs to this business)
        const staff = await Staff.findOne({ 
            _id: staffId, 
            businessId: business._id 
        });

        if (!staff) {
            return res.status(404).render('error', { message: 'Staff member not found' });
        }

        // Get user data
        const user = await User.findById(userId);

        res.render('businessOwner/staff/form', { 
            staff, 
            business,
            user,
            error: null 
        });
    } catch (error) {
        console.error('Error loading edit form:', error);
        res.status(500).render('error', { message: 'Error loading form' });
    }
};

/**
 * Update staff
 */
exports.updateStaff = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { staffId } = req.params;
        const { name, email, phone, specialties, isActive } = req.body;

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Parse specialties
        let specialtiesArray = [];
        if (specialties) {
            specialtiesArray = Array.isArray(specialties) ? specialties : [specialties];
            specialtiesArray = specialtiesArray
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }

        // Update staff (ensure it belongs to this business)
        await Staff.findOneAndUpdate(
            { _id: staffId, businessId: business._id },
            {
                name,
                email: email.toLowerCase(),
                phone: phone ? phone.trim() : '',
                specialties: specialtiesArray,
                isActive: isActive === 'true'
            }
        );

        console.log('✓ Staff updated:', staffId);
        res.redirect('/business-owner/staff');
    } catch (error) {
        console.error('Error updating staff:', error);
        res.status(500).render('error', { message: 'Error updating staff: ' + error.message });
    }
};

/**
 * Deactivate staff
 */
exports.deactivateStaff = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { staffId } = req.params;

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Deactivate staff (ensure it belongs to this business)
        await Staff.findOneAndUpdate(
            { _id: staffId, businessId: business._id },
            { isActive: false }
        );

        console.log('✓ Staff deactivated:', staffId);
        res.redirect('/business-owner/staff');
    } catch (error) {
        console.error('Error deactivating staff:', error);
        res.status(500).render('error', { message: 'Error deactivating staff' });
    }
};

/**
 * Activate staff
 */
exports.activateStaff = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { staffId } = req.params;

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Activate staff (ensure it belongs to this business)
        await Staff.findOneAndUpdate(
            { _id: staffId, businessId: business._id },
            { isActive: true }
        );

        console.log('✓ Staff activated:', staffId);
        res.redirect('/business-owner/staff');
    } catch (error) {
        console.error('Error activating staff:', error);
        res.status(500).render('error', { message: 'Error activating staff' });
    }
};


/**
 * Delete staff
 */
exports.deleteStaff = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { staffId } = req.params;

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Delete staff (ensure it belongs to this business)
        const deletedStaff = await Staff.findOneAndDelete({ 
            _id: staffId, 
            businessId: business._id 
        });

        if (!deletedStaff) {
            return res.status(404).render('error', { message: 'Staff member not found' });
        }

        console.log('✓ Staff deleted:', staffId);
        res.redirect('/business-owner/staff');
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).render('error', { message: 'Error deleting staff' });
    }
};

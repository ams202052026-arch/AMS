/**
 * Business Owner Services Controller
 * Handles service management for business owners
 */

const Service = require('../../models/service');
const Staff = require('../../models/staff');
const Business = require('../../models/business');
const SystemSettings = require('../../models/systemSettings');
const { uploadToCloudinary } = require('../../config/cloudinary');

/**
 * List all services for the business
 */
exports.listServices = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Get services for this business
        const services = await Service.find({ businessId: business._id })
            .populate('assignedStaff')
            .sort({ createdAt: -1 });

        // Get user data
        const User = require('../../models/user');
        const user = await User.findById(userId);

        res.render('businessOwner/services/list', { 
            services, 
            business,
            user 
        });
    } catch (error) {
        console.error('Error loading services:', error);
        res.status(500).render('error', { message: 'Error loading services' });
    }
};

/**
 * Load add service form
 */
exports.loadAddForm = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Get staff for this business
        const staff = await Staff.find({ 
            businessId: business._id, 
            isActive: true 
        });

        // Get system settings
        const settings = await SystemSettings.getSettings();

        // Get user data
        const User = require('../../models/user');
        const user = await User.findById(userId);

        res.render('businessOwner/services/form', { 
            service: null, 
            staff, 
            business,
            user,
            settings,
            error: null 
        });
    } catch (error) {
        console.error('Error loading add form:', error);
        res.status(500).render('error', { message: 'Error loading form' });
    }
};

/**
 * Add new service
 */
exports.addService = async (req, res) => {
    try {
        const userId = req.session.userId;
        
        // Check if req.body is undefined
        if (!req.body) {
            console.error('req.body is undefined - multer configuration issue');
            return res.status(400).render('error', { 
                message: 'Form data not received properly. Please try again.' 
            });
        }
        
        const { 
            name, 
            description, 
            details, 
            price, 
            duration, 
            category, 
            assignedStaff, 
            pointsEarned, 
            image, 
            minAdvanceBookingValue, 
            minAdvanceBookingUnit 
        } = req.body;
        
        // Validate required fields
        if (!name || !price || !duration || !category) {
            console.error('Missing required fields:', { name, price, duration, category });
            
            // Get data for re-rendering form
            const business = await Business.findOne({ ownerId: userId });
            const staff = await Staff.find({ businessId: business._id, isActive: true });
            const User = require('../../models/user');
            const user = await User.findById(userId);

            return res.render('businessOwner/services/form', { 
                service: null, 
                staff, 
                business,
                user,
                error: 'Please fill in all required fields (Name, Price, Duration, Category)' 
            });
        }
        
        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Get system settings for points validation
        const settings = await SystemSettings.getSettings();
        const maxPoints = settings.maxPointsPerService;
        const minPoints = settings.minPointsPerService;

        // Validate points
        const points = parseInt(pointsEarned) || 10;
        if (points < minPoints || points > maxPoints) {
            const staff = await Staff.find({ businessId: business._id, isActive: true });
            const User = require('../../models/user');
            const user = await User.findById(userId);

            return res.render('businessOwner/services/form', { 
                service: null, 
                staff, 
                business,
                user,
                error: `Points must be between ${minPoints} and ${maxPoints}. Please adjust the loyalty points value.` 
            });
        }

        console.log('Adding service for business:', business.businessName);

        // Handle image upload to Cloudinary
        let serviceImageUrl = image || '/image/default-service.jpg';
        
        if (req.file) {
            try {
                console.log('Uploading service image to Cloudinary...');
                const filename = `service-${business._id}-${Date.now()}`;
                const result = await uploadToCloudinary(req.file.buffer, filename, 'service-images');
                serviceImageUrl = result.secure_url;
                console.log('✓ Image uploaded to Cloudinary:', serviceImageUrl);
            } catch (uploadError) {
                console.error('Error uploading to Cloudinary:', uploadError);
                // Continue with default image if upload fails
            }
        }

        // Handle assignedStaff - it can be a string (single) or array (multiple)
        let staffArray = [];
        if (assignedStaff) {
            staffArray = Array.isArray(assignedStaff) ? assignedStaff : [assignedStaff];
        }

        const service = new Service({
            name,
            description,
            details: details ? details.split('\n').filter(d => d.trim()) : [],
            price: parseFloat(price),
            duration: parseInt(duration),
            category,
            businessId: business._id, // Associate with business
            assignedStaff: staffArray,
            pointsEarned: parseInt(pointsEarned) || 10,
            image: serviceImageUrl,
            minAdvanceBooking: {
                value: parseInt(minAdvanceBookingValue) || 0,
                unit: minAdvanceBookingUnit || 'hours'
            }
        });

        await service.save();
        console.log('✓ Service created:', service._id);

        // Update staff specialties
        if (staffArray.length > 0) {
            await Staff.updateMany(
                { _id: { $in: staffArray } },
                { $addToSet: { specialties: service._id } }
            );
            console.log('✓ Staff specialties updated');
        }

        res.redirect('/business-owner/services');
    } catch (error) {
        console.error('Error adding service:', error);
        
        // Get data for re-rendering form
        const userId = req.session.userId;
        const business = await Business.findOne({ ownerId: userId });
        const staff = await Staff.find({ businessId: business._id, isActive: true });
        const User = require('../../models/user');
        const user = await User.findById(userId);

        res.render('businessOwner/services/form', { 
            service: null, 
            staff, 
            business,
            user,
            error: 'Error adding service: ' + error.message 
        });
    }
};

/**
 * Load edit service form
 */
exports.loadEditForm = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { serviceId } = req.params;
        
        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Get service (ensure it belongs to this business)
        const service = await Service.findOne({ 
            _id: serviceId, 
            businessId: business._id 
        }).populate('assignedStaff');

        if (!service) {
            return res.status(404).render('error', { message: 'Service not found' });
        }

        // Get staff for this business
        const staff = await Staff.find({ 
            businessId: business._id, 
            isActive: true 
        });

        // Get system settings
        const settings = await SystemSettings.getSettings();

        // Get user data
        const User = require('../../models/user');
        const user = await User.findById(userId);

        res.render('businessOwner/services/form', { 
            service, 
            staff, 
            business,
            user,
            settings,
            error: null 
        });
    } catch (error) {
        console.error('Error loading edit form:', error);
        res.status(500).render('error', { message: 'Error loading form' });
    }
};

/**
 * Update service
 */
exports.updateService = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { serviceId } = req.params;
        const { 
            name, 
            description, 
            details, 
            price, 
            duration, 
            category, 
            assignedStaff, 
            pointsEarned, 
            image, 
            isActive,
            keepCurrentImage,
            minAdvanceBookingValue, 
            minAdvanceBookingUnit 
        } = req.body;

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Get system settings for points validation
        const settings = await SystemSettings.getSettings();
        const maxPoints = settings.maxPointsPerService;
        const minPoints = settings.minPointsPerService;

        // Validate points
        const points = parseInt(pointsEarned) || 10;
        if (points < minPoints || points > maxPoints) {
            const staff = await Staff.find({ businessId: business._id, isActive: true });
            const User = require('../../models/user');
            const user = await User.findById(userId);
            const service = await Service.findOne({ _id: serviceId, businessId: business._id });

            return res.render('businessOwner/services/form', { 
                service, 
                staff, 
                business,
                user,
                error: `Points must be between ${minPoints} and ${maxPoints}. Please adjust the loyalty points value.` 
            });
        }

        // Get current service to preserve image if needed
        const currentService = await Service.findOne({ 
            _id: serviceId, 
            businessId: business._id 
        });

        if (!currentService) {
            return res.status(404).render('error', { message: 'Service not found' });
        }

        // Handle image upload to Cloudinary
        let serviceImageUrl = currentService.image; // Keep current image by default
        
        if (req.file) {
            try {
                console.log('Uploading new service image to Cloudinary...');
                const filename = `service-${business._id}-${Date.now()}`;
                const result = await uploadToCloudinary(req.file.buffer, filename, 'service-images');
                serviceImageUrl = result.secure_url;
                console.log('✓ New image uploaded to Cloudinary:', serviceImageUrl);
            } catch (uploadError) {
                console.error('Error uploading to Cloudinary:', uploadError);
                // Keep current image if upload fails
            }
        } else if (image && image.trim() && image !== currentService.image) {
            // Use provided URL if different from current
            serviceImageUrl = image;
        } else if (keepCurrentImage === 'false') {
            // User removed image, use default
            serviceImageUrl = '/image/default-service.jpg';
        }

        // Handle assignedStaff
        let staffArray = [];
        if (assignedStaff) {
            staffArray = Array.isArray(assignedStaff) ? assignedStaff : [assignedStaff];
        }

        // Update service (ensure it belongs to this business)
        await Service.findOneAndUpdate(
            { _id: serviceId, businessId: business._id },
            {
                name,
                description,
                details: details ? details.split('\n').filter(d => d.trim()) : [],
                price: parseFloat(price),
                duration: parseInt(duration),
                category,
                assignedStaff: staffArray,
                pointsEarned: parseInt(pointsEarned) || 10,
                image: serviceImageUrl,
                isActive: isActive === 'true',
                minAdvanceBooking: {
                    value: parseInt(minAdvanceBookingValue) || 0,
                    unit: minAdvanceBookingUnit || 'hours'
                }
            }
        );

        console.log('✓ Service updated:', serviceId);

        res.redirect('/business-owner/services');
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).render('error', { message: 'Error updating service: ' + error.message });
    }
};

/**
 * Deactivate service
 */
exports.deactivateService = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { serviceId } = req.params;

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Deactivate service (ensure it belongs to this business)
        await Service.findOneAndUpdate(
            { _id: serviceId, businessId: business._id },
            { isActive: false }
        );

        console.log('✓ Service deactivated:', serviceId);
        res.redirect('/business-owner/services');
    } catch (error) {
        console.error('Error deactivating service:', error);
        res.status(500).render('error', { message: 'Error deactivating service' });
    }
};

/**
 * Activate service
 */
exports.activateService = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { serviceId } = req.params;

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Activate service (ensure it belongs to this business)
        await Service.findOneAndUpdate(
            { _id: serviceId, businessId: business._id },
            { isActive: true }
        );

        console.log('✓ Service activated:', serviceId);
        res.redirect('/business-owner/services');
    } catch (error) {
        console.error('Error activating service:', error);
        res.status(500).render('error', { message: 'Error activating service' });
    }
};

/**
 * Delete service
 */
exports.deleteService = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { serviceId } = req.params;

        // Find business by ownerId
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.redirect('/business/register');
        }

        // Delete service (ensure it belongs to this business)
        const deletedService = await Service.findOneAndDelete({ 
            _id: serviceId, 
            businessId: business._id 
        });

        if (!deletedService) {
            return res.status(404).render('error', { message: 'Service not found' });
        }

        // Remove service from staff specialties
        await Staff.updateMany(
            { specialties: serviceId },
            { $pull: { specialties: serviceId } }
        );

        console.log('✓ Service deleted:', serviceId);
        res.redirect('/business-owner/services');
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).render('error', { message: 'Error deleting service' });
    }
};
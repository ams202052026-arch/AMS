const Service = require('../../models/service');
const Staff = require('../../models/staff');

// List all services
exports.listServices = async (req, res) => {
    try {
        const services = await Service.find().populate('assignedStaff');
        res.render('admin/services/list', { services });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading services' });
    }
};

// Load add service form
exports.loadAddForm = async (req, res) => {
    try {
        const staff = await Staff.find({ isActive: true });
        res.render('admin/services/form', { service: null, staff });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading form' });
    }
};

// Add new service
exports.addService = async (req, res) => {
    try {
        const { name, description, details, price, duration, category, assignedStaff, pointsEarned, image, minAdvanceBookingValue, minAdvanceBookingUnit } = req.body;
        
        console.log('Adding service:', { name, price, duration, category, minAdvanceBooking: { value: minAdvanceBookingValue, unit: minAdvanceBookingUnit } });
        console.log('Assigned staff:', assignedStaff);

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
            assignedStaff: staffArray,
            pointsEarned: parseInt(pointsEarned) || 10,
            image: image || '/image/default-service.jpg',
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

        res.redirect('/admin/services');
    } catch (error) {
        console.error('Error adding service:', error);
        res.status(500).render('error', { message: 'Error adding service: ' + error.message });
    }
};

// Load edit service form
exports.loadEditForm = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const service = await Service.findById(serviceId);
        const staff = await Staff.find({ isActive: true });
        res.render('admin/services/form', { service, staff });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading form' });
    }
};

// Update service
exports.updateService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        const { name, description, details, price, duration, category, assignedStaff, pointsEarned, image, isActive, minAdvanceBookingValue, minAdvanceBookingUnit } = req.body;

        await Service.findByIdAndUpdate(serviceId, {
            name,
            description,
            details: details ? details.split('\n').filter(d => d.trim()) : [],
            price: parseFloat(price),
            duration: parseInt(duration),
            category,
            assignedStaff: assignedStaff || [],
            pointsEarned: parseInt(pointsEarned) || 10,
            image: image || '/image/default-service.jpg',
            isActive: isActive === 'true',
            minAdvanceBooking: {
                value: parseInt(minAdvanceBookingValue) || 0,
                unit: minAdvanceBookingUnit || 'hours'
            }
        });

        res.redirect('/admin/services');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error updating service' });
    }
};

// Deactivate service
exports.deactivateService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        await Service.findByIdAndUpdate(serviceId, { isActive: false });
        res.redirect('/admin/services');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error deactivating service' });
    }
};

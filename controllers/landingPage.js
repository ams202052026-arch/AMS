const Service = require('../models/service');

exports.loadLandingPage = async (req, res) => {
    try {
        const Business = require('../models/business');
        
        // Get all approved and active businesses
        const approvedBusinesses = await Business.find({ 
            verificationStatus: 'approved',
            isActive: true 
        }).select('_id');
        
        const businessIds = approvedBusinesses.map(b => b._id);
        
        // Get active services only from approved businesses with valid images
        const services = await Service.find({ 
            isActive: true,
            businessId: { $in: businessIds },
            image: { $exists: true, $ne: null, $ne: '' }
        })
        .limit(12)
        .sort({ createdAt: -1 });
        
        res.render('landingPage', { services });
    } catch (error) {
        console.error('Error loading landing page:', error);
        res.render('landingPage', { services: [] });
    }
}
const Service = require('../models/service');

exports.loadLandingPage = async (req, res) => {
    try {
        // Get all active services
        const services = await Service.find({ isActive: true }).limit(10);
        
        res.render('landingPage', { services });
    } catch (error) {
        console.error('Error loading landing page:', error);
        res.render('landingPage', { services: [] });
    }
}
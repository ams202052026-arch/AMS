const Service = require('../models/service');
const User = require('../models/user');
const Business = require('../models/business');

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
}

exports.loadHome = async (req, res) => {
    try {
        // User data is already attached by middleware (req.user and res.locals.user)
        const userId = req.session.userId;
        
        // Get all active services with approved businesses only
        const services = await Service.find({ isActive: true })
            .populate('assignedStaff')
            .populate('businessId'); // Populate business info
        
        // Filter out services from suspended/rejected businesses AND user's own business
        const activeServices = services.filter(service => {
            if (!service.businessId) return false; // No business = hide
            
            // Hide services from non-approved or inactive businesses
            if (service.businessId.verificationStatus !== 'approved' || 
                service.businessId.isActive !== true) {
                return false;
            }
            
            // Hide services from user's own business
            if (userId && service.businessId.ownerId && 
                service.businessId.ownerId.toString() === userId.toString()) {
                console.log(`🚫 Hiding service "${service.name}" - user owns this business`);
                return false;
            }
            
            return true;
        });

        res.render('home-redesign', { services: activeServices });
    } catch (error) {
        console.error('Error loading home:', error);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Error loading services',
            statusCode: 500
        });
    }
};

// API endpoint for filtering services by location
exports.filterByLocation = async (req, res) => {
    try {
        const { lat, lng, radius = 10 } = req.query; // radius in kilometers, default 10km
        const userId = req.session.userId;
        
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const searchRadius = parseFloat(radius);

        // Get all active services with approved businesses
        const services = await Service.find({ isActive: true })
            .populate('assignedStaff')
            .populate('businessId');
        
        // Filter and calculate distances
        const servicesWithDistance = services
            .filter(service => {
                if (!service.businessId) return false;
                if (service.businessId.verificationStatus !== 'approved') return false;
                if (!service.businessId.isActive) return false;
                
                // Hide services from user's own business
                if (userId && service.businessId.ownerId && 
                    service.businessId.ownerId.toString() === userId.toString()) {
                    return false;
                }
                
                // Check if business has coordinates
                const coords = service.businessId.address?.coordinates;
                if (!coords || !coords.lat || !coords.lng) return false;
                
                return true;
            })
            .map(service => {
                const businessCoords = service.businessId.address.coordinates;
                const distance = calculateDistance(
                    userLat, 
                    userLng, 
                    businessCoords.lat, 
                    businessCoords.lng
                );
                
                return {
                    ...service.toObject(),
                    distance: distance.toFixed(2) // Distance in km
                };
            })
            .filter(service => service.distance <= searchRadius)
            .sort((a, b) => a.distance - b.distance); // Sort by nearest first

        res.json({
            success: true,
            count: servicesWithDistance.length,
            services: servicesWithDistance
        });
    } catch (error) {
        console.error('Error filtering by location:', error);
        res.status(500).json({ error: 'Error filtering services' });
    }
};
const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/services');

router.get('/', servicesController.getAllServices);
router.get('/slots', servicesController.getAvailableSlots); // Must come BEFORE /:serviceId
router.get('/business-availability', servicesController.getBusinessAvailability); // Check if business is open
router.get('/:serviceId', servicesController.getServiceDetails);

module.exports = router;

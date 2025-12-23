/**
 * Business Owner Routes
 * Handles business owner registration and dashboard
 */

const express = require('express');
const router = express.Router();
const businessOwnerAuthController = require('../controllers/businessOwnerAuth');
const dashboardController = require('../controllers/businessOwner/dashboard');
const servicesController = require('../controllers/businessOwner/services');
const staffController = require('../controllers/businessOwner/staff');
const appointmentsController = require('../controllers/businessOwner/appointments');
const reportsController = require('../controllers/businessOwner/reports');
const { redirectIfAuthenticated, isBusinessOwner, canAccessBusiness } = require('../middleware/auth');
const { uploadBusinessDocuments, uploadServiceImage } = require('../config/cloudinary');

// Authentication routes (public)
router.get('/login', redirectIfAuthenticated, dashboardController.loadLoginPage);
router.post('/login', dashboardController.login);
router.get('/signup', redirectIfAuthenticated, dashboardController.loadSignupPage);
router.post('/signup', dashboardController.signup);
router.get('/logout', dashboardController.logout);

// Business application routes (separate from account creation)
router.get('/apply', isBusinessOwner, businessOwnerAuthController.loadRegistrationPage);
router.post('/apply', isBusinessOwner, businessOwnerAuthController.register);

// Document upload routes (after registration)
router.get('/upload-documents', businessOwnerAuthController.loadDocumentUploadPage);
router.post('/upload-documents', 
    uploadBusinessDocuments.fields([
        { name: 'dti', maxCount: 1 },
        { name: 'business_permit', maxCount: 1 },
        { name: 'valid_id', maxCount: 1 },
        { name: 'bir', maxCount: 1 }
    ]),
    businessOwnerAuthController.uploadDocuments
);
router.post('/skip-documents', businessOwnerAuthController.skipDocumentUpload);

// Email verification
router.get('/verify-email/:token', businessOwnerAuthController.verifyEmail);

// Business Owner Dashboard (protected)
router.get('/dashboard', canAccessBusiness, dashboardController.loadDashboard);

// Services Management
router.get('/services', canAccessBusiness, servicesController.listServices);
router.get('/services/add', canAccessBusiness, servicesController.loadAddForm);
router.post('/services', canAccessBusiness, (req, res, next) => {
    // Custom middleware to handle optional file upload
    uploadServiceImage.single('serviceImage')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            // If there's a multer error, continue without file
            req.file = null;
        }
        // Always continue to next middleware
        next();
    });
}, servicesController.addService);
router.get('/services/:serviceId/edit', canAccessBusiness, servicesController.loadEditForm);
router.put('/services/:serviceId', canAccessBusiness, (req, res, next) => {
    // Custom middleware to handle optional file upload
    uploadServiceImage.single('serviceImage')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            // If there's a multer error, continue without file
            req.file = null;
        }
        
        // Handle method override for multipart forms
        if (req.body && req.body._method) {
            req.method = req.body._method.toUpperCase();
            delete req.body._method;
        }
        
        // Always continue to next middleware
        next();
    });
}, servicesController.updateService);

// Add POST route for service updates (handles multipart form method override)
router.post('/services/:serviceId', canAccessBusiness, (req, res, next) => {
    // First, let multer process the form
    uploadServiceImage.single('serviceImage')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            // If there's a multer error, continue without file
            req.file = null;
        }
        
        // Now check if this is actually an update request
        if (req.body && req.body._method === 'PUT') {
            // Remove the _method field since we're handling it
            delete req.body._method;
            // Continue to the update controller
            next();
        } else {
            // This is not an update request, return 404
            res.status(404).send('Not Found');
        }
    });
}, servicesController.updateService);
router.post('/services/:serviceId/deactivate', canAccessBusiness, servicesController.deactivateService);
router.post('/services/:serviceId/activate', canAccessBusiness, servicesController.activateService);

// Staff Management
router.get('/staff', canAccessBusiness, staffController.listStaff);
router.get('/staff/add', canAccessBusiness, staffController.loadAddForm);
router.post('/staff', canAccessBusiness, staffController.addStaff);
router.get('/staff/:staffId/edit', canAccessBusiness, staffController.loadEditForm);
router.put('/staff/:staffId', canAccessBusiness, staffController.updateStaff);
router.post('/staff/:staffId/deactivate', canAccessBusiness, staffController.deactivateStaff);
router.post('/staff/:staffId/activate', canAccessBusiness, staffController.activateStaff);

// Appointments Management
router.get('/appointments', canAccessBusiness, appointmentsController.listAppointments);
router.post('/appointments/:appointmentId/confirm', canAccessBusiness, appointmentsController.confirmAppointment);
router.post('/appointments/:appointmentId/start', canAccessBusiness, appointmentsController.startService);
router.post('/appointments/:appointmentId/complete', canAccessBusiness, appointmentsController.completeAppointment);
router.post('/appointments/:appointmentId/cancel', canAccessBusiness, appointmentsController.cancelAppointment);
router.post('/appointments/:appointmentId/no-show', canAccessBusiness, appointmentsController.markNoShow);

// Business Hours Management
const businessHoursController = require('../controllers/businessOwner/businessHours');
router.get('/business-hours', canAccessBusiness, businessHoursController.loadBusinessHours);
router.post('/business-hours', canAccessBusiness, businessHoursController.updateBusinessHours);
router.post('/toggle-operations', canAccessBusiness, businessHoursController.toggleBusinessOperations);

// API endpoint for checking business availability (used by customer booking)
router.get('/api/business-availability', businessHoursController.getBusinessAvailability);

// TODO: Add more dashboard routes
// router.get('/profile', canAccessBusiness, profileController.loadProfile);
// router.get('/reports', canAccessBusiness, reportsController.loadReports);

module.exports = router;

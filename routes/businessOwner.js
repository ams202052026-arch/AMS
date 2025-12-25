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
    (req, res, next) => {
        uploadBusinessDocuments.fields([
            { name: 'dti', maxCount: 1 },
            { name: 'business_permit', maxCount: 1 },
            { name: 'valid_id', maxCount: 1 },
            { name: 'bir', maxCount: 1 }
        ])(req, res, (err) => {
            if (err) {
                console.error('File upload error:', err);
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).render('businessOwner/uploadDocuments', {
                        error: 'File size too large. Maximum file size is 10MB per file.',
                        success: null
                    });
                }
                if (err.message) {
                    return res.status(400).render('businessOwner/uploadDocuments', {
                        error: err.message,
                        success: null
                    });
                }
                return res.status(500).render('businessOwner/uploadDocuments', {
                    error: 'Error uploading files. Please try again.',
                    success: null
                });
            }
            next();
        });
    },
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

// IMPORTANT: Specific routes must come BEFORE general /:serviceId route
router.post('/services/:serviceId/deactivate', canAccessBusiness, servicesController.deactivateService);
router.post('/services/:serviceId/activate', canAccessBusiness, servicesController.activateService);
router.post('/services/:serviceId/delete', canAccessBusiness, servicesController.deleteService);

// Handle service updates - POST with _method=PUT
router.post('/services/:serviceId', canAccessBusiness, (req, res, next) => {
    // First, let multer process the form
    uploadServiceImage.single('serviceImage')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            req.file = null;
        }
        
        // Check if this is an update request (has _method=PUT)
        if (req.body && req.body._method === 'PUT') {
            delete req.body._method;
            return servicesController.updateService(req, res);
        }
        
        // Otherwise, not found
        res.status(404).send('Not Found');
    });
});

// Also support PUT method directly
router.put('/services/:serviceId', canAccessBusiness, (req, res, next) => {
    uploadServiceImage.single('serviceImage')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            req.file = null;
        }
        
        if (req.body && req.body._method) {
            delete req.body._method;
        }
        
        next();
    });
}, servicesController.updateService);
router.delete('/services/:serviceId', canAccessBusiness, servicesController.deleteService);

// Staff Management
router.get('/staff', canAccessBusiness, staffController.listStaff);
router.get('/staff/add', canAccessBusiness, staffController.loadAddForm);
router.post('/staff', canAccessBusiness, staffController.addStaff);
router.get('/staff/:staffId/edit', canAccessBusiness, staffController.loadEditForm);
router.put('/staff/:staffId', canAccessBusiness, staffController.updateStaff);
router.post('/staff/:staffId/deactivate', canAccessBusiness, staffController.deactivateStaff);
router.post('/staff/:staffId/activate', canAccessBusiness, staffController.activateStaff);
router.post('/staff/:staffId/delete', canAccessBusiness, staffController.deleteStaff);

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

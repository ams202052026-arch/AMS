/**
 * Unified Business Routes
 * Handles business mode switching and applications for existing customers
 */

const express = require('express');
const router = express.Router();
const businessOwnerAuthController = require('../controllers/businessOwnerAuth');
const dashboardController = require('../controllers/businessOwner/dashboard');
const { requireAuth, isBusinessOwner } = require('../middleware/auth');
const { uploadBusinessDocuments } = require('../config/cloudinary');

// Business application routes (for existing customers)
router.get('/register', requireAuth, businessOwnerAuthController.loadRegistrationPage);
router.post('/register', requireAuth, businessOwnerAuthController.register);

// Document upload routes (after registration)
router.get('/upload-documents', requireAuth, businessOwnerAuthController.loadDocumentUploadPage);
router.post('/upload-documents', 
    requireAuth,
    uploadBusinessDocuments.fields([
        { name: 'dti', maxCount: 1 },
        { name: 'business_permit', maxCount: 1 },
        { name: 'valid_id', maxCount: 1 },
        { name: 'bir', maxCount: 1 }
    ]),
    businessOwnerAuthController.uploadDocuments
);
router.post('/skip-documents', requireAuth, businessOwnerAuthController.skipDocumentUpload);

// Business status and reapplication
router.get('/status', requireAuth, businessOwnerAuthController.loadApplicationStatus);
router.get('/reapply', requireAuth, businessOwnerAuthController.loadReapplicationPage);
router.post('/reapply', requireAuth, businessOwnerAuthController.reapply);

// Business Dashboard (for approved business owners)
router.get('/dashboard', requireAuth, isBusinessOwner, dashboardController.loadDashboard);

module.exports = router;
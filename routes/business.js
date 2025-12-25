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
const fetch = require('node-fetch');

// Geocoding proxy endpoint (no auth required)
router.get('/geocode', async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Missing coordinates' });
        }

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'BookingApp/1.0'
                }
            }
        );

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({ error: 'Geocoding failed' });
    }
});

// Business application routes (for existing customers)
router.get('/register', requireAuth, businessOwnerAuthController.loadRegistrationPage);
router.post('/register', requireAuth, businessOwnerAuthController.register);

// Document upload routes (after registration)
router.get('/upload-documents', requireAuth, businessOwnerAuthController.loadDocumentUploadPage);
router.post('/upload-documents', 
    requireAuth,
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
router.post('/skip-documents', requireAuth, businessOwnerAuthController.skipDocumentUpload);

// Business status and reapplication
router.get('/status', requireAuth, businessOwnerAuthController.loadApplicationStatus);
router.get('/reapply', requireAuth, businessOwnerAuthController.loadReapplicationPage);
router.post('/reapply', requireAuth, businessOwnerAuthController.reapply);

// Business Dashboard (for approved business owners)
router.get('/dashboard', requireAuth, isBusinessOwner, dashboardController.loadDashboard);

module.exports = router;
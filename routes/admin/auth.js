/**
 * Super Admin Authentication Routes
 * Handles super admin login and setup
 */

const express = require('express');
const router = express.Router();
const superAdminAuthController = require('../../controllers/superAdminAuth');

// Admin login
router.get('/login', superAdminAuthController.loadLoginPage);
router.post('/login', superAdminAuthController.login);

// Admin logout
router.get('/logout', superAdminAuthController.logout);

// Initial setup (create first super admin)
// This should be disabled in production or protected
router.post('/setup', superAdminAuthController.createInitialSuperAdmin);

module.exports = router;

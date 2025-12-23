/**
 * Authentication Routes
 * Handles login, signup, and logout for customers and business owners
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { redirectIfAuthenticated, requireAuth } = require('../middleware/auth');

// Login routes
router.get('/login', redirectIfAuthenticated, authController.loadLoginPage);
router.post('/login', authController.login);

// Signup routes (customer)
router.get('/signUp', redirectIfAuthenticated, authController.loadSignUpPage);
// Note: Actual signup POST is handled by OTP flow in existing routes

// Logout
router.get('/logout', authController.logout);

// Redirect to appropriate home
router.get('/redirect-home', authController.redirectToHome);

// Mode switching routes
router.get('/switch-to-business', requireAuth, authController.switchToBusiness);
router.get('/switch-to-customer', requireAuth, authController.switchToCustomer);
router.get('/api/mode-status', requireAuth, authController.getModeStatus);

module.exports = router;

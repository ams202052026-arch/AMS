const express = require('express');
const router = express.Router();

const authController = require('../../controllers/superAdminAuth');
const dashboardController = require('../../controllers/admin/dashboard');
const businessesController = require('../../controllers/admin/businesses');
const usersController = require('../../controllers/admin/users');
const rewardsController = require('../../controllers/admin/rewards');
const forgotPasswordController = require('../../controllers/admin/forgotPassword');

// Import authentication middleware
const { isSuperAdmin, attachUserData } = require('../../middleware/auth');

// Import admin access utilities
const { PERMANENT_ADMIN_TOKEN } = require('../../middleware/adminAccess');

// Secure admin access route (requires token)
// This is the ONLY public entry point to admin area
router.get('/secure-access', (req, res) => {
    const token = req.query.token;
    
    if (!token) {
        return res.status(403).render('error', {
            title: 'Access Denied',
            message: 'Admin access requires a valid security token. Please contact the system administrator.',
            statusCode: 403
        });
    }
    
    // Check if it's the permanent token
    const isPermanentToken = token === PERMANENT_ADMIN_TOKEN;
    
    // Store token in session for verification
    req.session.adminAccessToken = token;
    req.session.adminAccessGranted = true;
    req.session.adminAccessTime = Date.now();
    req.session.isPermanentAccess = isPermanentToken;
    
    // Redirect to admin login
    res.redirect('/admin/login');
});

// Middleware to check if admin access was granted via secure token
function requireSecureAccess(req, res, next) {
    // Skip check if already logged in as super admin
    if (req.session.user && req.session.user.role === 'super_admin') {
        return next();
    }
    
    // Check if secure access was granted
    if (!req.session.adminAccessGranted) {
        return res.status(403).render('error', {
            title: 'Access Denied',
            message: 'Direct access to admin area is not allowed. Please use the secure access link.',
            statusCode: 403
        });
    }
    
    // Skip expiry check for permanent access tokens
    if (req.session.isPermanentAccess) {
        return next();
    }
    
    // Check if access token is still valid (1 hour expiry for temporary tokens)
    const accessTime = req.session.adminAccessTime || 0;
    const oneHour = 60 * 60 * 1000;
    
    if (Date.now() - accessTime > oneHour) {
        req.session.adminAccessGranted = false;
        return res.status(403).render('error', {
            title: 'Access Expired',
            message: 'Your admin access token has expired. Please request a new secure access link.',
            statusCode: 403
        });
    }
    
    next();
}

// Auth routes (protected by secure access)
router.get('/login', requireSecureAccess, authController.loadLoginPage);
router.post('/login', requireSecureAccess, authController.login);
router.get('/logout', authController.logout);

// Initial setup route (create first super admin) - protected
router.post('/setup', requireSecureAccess, authController.createInitialSuperAdmin);

// Remove the public /admin/access route - no longer needed
// Admin access is now only via secure token

// Forgot Password routes (protected by secure access)
router.get('/forgot-password', requireSecureAccess, forgotPasswordController.loadForgotPasswordPage);
router.post('/forgot-password/send-otp', requireSecureAccess, forgotPasswordController.sendResetOTP);
router.get('/forgot-password/verify-otp', requireSecureAccess, forgotPasswordController.loadVerifyOTPPage);
router.post('/forgot-password/verify-otp', requireSecureAccess, forgotPasswordController.verifyResetOTP);
router.get('/forgot-password/reset-password', requireSecureAccess, forgotPasswordController.loadResetPasswordPage);
router.post('/forgot-password/reset-password', requireSecureAccess, forgotPasswordController.resetPassword);

// Dashboard (protected)
router.get('/dashboard', isSuperAdmin, attachUserData, dashboardController.loadDashboard);

// Business Management (protected)
router.get('/businesses', isSuperAdmin, attachUserData, businessesController.listBusinesses);
router.get('/businesses/:businessId', isSuperAdmin, attachUserData, businessesController.viewBusinessDetails);
router.post('/businesses/:businessId/approve', isSuperAdmin, businessesController.approveBusiness);
router.post('/businesses/:businessId/reject', isSuperAdmin, businessesController.rejectBusiness);
router.post('/businesses/:businessId/suspend', isSuperAdmin, businessesController.suspendBusiness);
router.post('/businesses/:businessId/reactivate', isSuperAdmin, businessesController.reactivateBusiness);
router.delete('/businesses/:businessId/delete', isSuperAdmin, businessesController.deleteBusiness);

// User Management (protected)
router.get('/users', isSuperAdmin, attachUserData, usersController.listUsers);
router.get('/users/:userId', isSuperAdmin, attachUserData, usersController.viewUserDetails);
router.post('/users/:userId/ban', isSuperAdmin, usersController.banUser);
router.post('/users/:userId/unban', isSuperAdmin, usersController.unbanUser);
router.post('/users/:userId/deactivate', isSuperAdmin, usersController.deactivateUser);
router.post('/users/:userId/reactivate', isSuperAdmin, usersController.reactivateUser);
router.post('/users/:userId/reset-password', isSuperAdmin, usersController.resetUserPassword);
router.delete('/users/:userId/delete', isSuperAdmin, usersController.deleteUser);

// Rewards Management (protected)
router.get('/rewards', isSuperAdmin, attachUserData, rewardsController.listRewards);
router.get('/rewards/add', isSuperAdmin, attachUserData, rewardsController.loadAddForm);
router.post('/rewards/add', isSuperAdmin, rewardsController.addReward);
router.get('/rewards/:rewardId/edit', isSuperAdmin, attachUserData, rewardsController.loadEditForm);
router.post('/rewards/:rewardId/edit', isSuperAdmin, rewardsController.updateReward);
router.post('/rewards/:rewardId/deactivate', isSuperAdmin, rewardsController.deactivateReward);
router.post('/rewards/:rewardId/activate', isSuperAdmin, rewardsController.activateReward);
router.get('/rewards/redemptions', isSuperAdmin, attachUserData, rewardsController.viewRedemptions);
router.delete('/rewards/:rewardId/delete', isSuperAdmin, rewardsController.deleteReward);
router.post('/rewards/points-settings', isSuperAdmin, rewardsController.updatePointsSettings);

module.exports = router;

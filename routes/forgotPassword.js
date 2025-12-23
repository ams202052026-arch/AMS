const express = require('express');
const router = express.Router();
const forgotPasswordController = require('../controllers/forgotPassword');

// Step 1: Show forgot password form
router.get('/', forgotPasswordController.loadForgotPasswordPage);

// Step 2: Send OTP
router.post('/send-otp', forgotPasswordController.sendResetOTP);

// Step 3: Show OTP verification page
router.get('/verify-otp', forgotPasswordController.loadVerifyOTPPage);

// Step 4: Verify OTP
router.post('/verify-otp', forgotPasswordController.verifyResetOTP);

// Step 5: Show reset password page
router.get('/reset', forgotPasswordController.loadResetPasswordPage);

// Step 6: Reset password
router.post('/reset', forgotPasswordController.resetPassword);

module.exports = router;

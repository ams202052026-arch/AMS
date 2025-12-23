const express = require('express');
const router = express.Router();
const otpCon = require('../controllers/otp');
const sessionChecker = require('../middleware/checkSession');
const check = require('../services/verifyCustomer');
const storeData = require('../controllers/signUp');






router.get('/', sessionChecker.checkCustomerDetails, otpCon.loadOTPForm);
router.post('/', check.verifyOTP, storeData.storeCustomerData);


module.exports = router;
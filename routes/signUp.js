const express = require('express');
const router = express.Router();
const sigUCon = require('../controllers/signUp');
const sigUpMw = require('../middleware/signUpMw')
const verification = require('../services/verifyCustomer')
const sessionChecker = require('../middleware/checkSession')

router.get('/', sigUCon.loadSignUpForm);
router.post('/', sigUpMw.checkIfUserExist, sessionChecker.checkCustomerDetails, verification.sendVerificationCode);

module.exports = router;

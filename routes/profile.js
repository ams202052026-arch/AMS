const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile');
const { isCustomer, checkAccountStatus, attachUserData } = require('../middleware/auth');

// All routes require customer authentication
router.get('/', isCustomer, checkAccountStatus, attachUserData, profileController.loadProfile);
router.post('/change-password', isCustomer, profileController.changePassword);
router.post('/delete', isCustomer, profileController.deleteAccount);

module.exports = router;

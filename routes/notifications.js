const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications');
const { isCustomer, checkAccountStatus, attachUserData } = require('../middleware/auth');

// View notifications page
router.get('/', isCustomer, checkAccountStatus, attachUserData, (req, res) => {
    res.render('notifications');
});

module.exports = router;

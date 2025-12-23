const express = require('express');
const router = express.Router();
const homeCon = require('../controllers/home');
const { isCustomer, checkAccountStatus, attachUserData } = require('../middleware/auth');

router.get('/', isCustomer, checkAccountStatus, attachUserData, homeCon.loadHome);
router.get('/api/filter-by-location', isCustomer, checkAccountStatus, homeCon.filterByLocation);

module.exports = router;
const express = require('express');
const router = express.Router();
const historyController = require('../controllers/history');
const { isCustomer, checkAccountStatus, attachUserData } = require('../middleware/auth');

router.get('/', isCustomer, checkAccountStatus, attachUserData, historyController.loadHistory);
router.post('/:appointmentId/delete', isCustomer, historyController.deleteHistory);
router.post('/clear-all', isCustomer, historyController.clearAllHistory);

module.exports = router;

const express = require('express');
const router = express.Router();
const rewardsController = require('../controllers/rewards');
const { isCustomer, checkAccountStatus, attachUserData } = require('../middleware/auth');

router.get('/', isCustomer, checkAccountStatus, attachUserData, rewardsController.loadRewards);
router.post('/redeem/:rewardId', isCustomer, rewardsController.redeemReward);

module.exports = router;

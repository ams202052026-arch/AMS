const { Reward, Redemption } = require('../models/reward');
const User = require('../models/user');
const Notification = require('../models/notification');

// Load rewards page
exports.loadRewards = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        
        const availableRewards = await Reward.find({ isActive: true });
        const myRedemptions = await Redemption.find({ 
            customer: userId 
        }).populate('reward').sort({ redeemedAt: -1 });

        res.render('rewards', { 
            customer: user, // Keep 'customer' for view compatibility
            user: user, // Also provide as 'user'
            availableRewards,
            myRedemptions,
            currentPoints: user.rewardPoints
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading rewards' });
    }
};

// Redeem a reward
exports.redeemReward = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { rewardId } = req.params;

        const user = await User.findById(userId);
        const reward = await Reward.findById(rewardId);

        if (!reward || !reward.isActive) {
            return res.status(404).json({ error: 'Reward not available' });
        }

        if (user.rewardPoints < reward.pointsRequired) {
            return res.status(400).json({ error: 'Insufficient points' });
        }

        // Deduct points
        user.rewardPoints -= reward.pointsRequired;
        await user.save();

        // Create redemption record
        const redemption = new Redemption({
            customer: userId,
            reward: rewardId,
            pointsUsed: reward.pointsRequired
        });
        await redemption.save();

        // Create notification
        await Notification.create({
            customer: userId,
            title: 'Reward Redeemed',
            message: `You have redeemed "${reward.name}" for ${reward.pointsRequired} points.`,
            type: 'reward_update'
        });

        res.redirect('/rewards');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error redeeming reward' });
    }
};

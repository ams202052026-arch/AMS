const { Reward, Redemption } = require('../../models/reward');
const SystemSettings = require('../../models/systemSettings');
const Service = require('../../models/service');

// List all rewards
exports.listRewards = async (req, res) => {
    try {
        const rewards = await Reward.find();
        const settings = await SystemSettings.getSettings();
        res.render('admin/rewards/list', { rewards, settings });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Error loading rewards',
            statusCode: 500
        });
    }
};

// Load add reward form
exports.loadAddForm = async (req, res) => {
    try {
        res.render('admin/rewards/form', { reward: null });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading form' });
    }
};

// Add new reward
exports.addReward = async (req, res) => {
    try {
        const { name, description, pointsRequired, discountValue, discountType } = req.body;
        
        const reward = new Reward({
            name,
            description,
            pointsRequired: parseInt(pointsRequired),
            type: 'discount',
            discountValue: discountValue ? parseFloat(discountValue) : null,
            discountType: discountType || 'percentage'
        });

        await reward.save();
        res.redirect('/admin/rewards');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error adding reward' });
    }
};

// Load edit reward form
exports.loadEditForm = async (req, res) => {
    try {
        const { rewardId } = req.params;
        const reward = await Reward.findById(rewardId);
        res.render('admin/rewards/form', { reward });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading form' });
    }
};

// Update reward
exports.updateReward = async (req, res) => {
    try {
        const { rewardId } = req.params;
        const { name, description, pointsRequired, discountValue, discountType, isActive } = req.body;

        await Reward.findByIdAndUpdate(rewardId, {
            name,
            description,
            pointsRequired: parseInt(pointsRequired),
            type: 'discount',
            discountValue: discountValue ? parseFloat(discountValue) : null,
            discountType: discountType || 'percentage',
            isActive: isActive === 'true'
        });

        res.redirect('/admin/rewards');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error updating reward' });
    }
};

// Deactivate reward
exports.deactivateReward = async (req, res) => {
    try {
        const { rewardId } = req.params;
        await Reward.findByIdAndUpdate(rewardId, { isActive: false });
        res.redirect('/admin/rewards');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error deactivating reward' });
    }
};

// Activate reward
exports.activateReward = async (req, res) => {
    try {
        const { rewardId } = req.params;
        await Reward.findByIdAndUpdate(rewardId, { isActive: true });
        res.redirect('/admin/rewards');
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error activating reward' });
    }
};

// Delete reward
exports.deleteReward = async (req, res) => {
    try {
        const { rewardId } = req.params;
        
        // Check if reward has any redemptions
        const redemptionCount = await Redemption.countDocuments({ reward: rewardId });
        
        if (redemptionCount > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete reward with existing redemptions. Deactivate it instead.' 
            });
        }
        
        await Reward.findByIdAndDelete(rewardId);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting reward' });
    }
};

// View redemptions
exports.viewRedemptions = async (req, res) => {
    try {
        const redemptions = await Redemption.find()
            .populate('customer')
            .populate('reward')
            .populate('appliedToAppointment')
            .sort({ redeemedAt: -1 })
            .limit(100);

        res.render('admin/rewards/redemptions', { redemptions });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading redemptions' });
    }
};

// Update points settings
exports.updatePointsSettings = async (req, res) => {
    try {
        const { maxPointsPerService, minPointsPerService } = req.body;
        
        // Validation
        const maxPoints = parseInt(maxPointsPerService);
        const minPoints = parseInt(minPointsPerService);
        
        if (isNaN(maxPoints) || maxPoints < 1 || maxPoints > 1000) {
            return res.status(400).json({ 
                error: 'Maximum points must be between 1 and 1000' 
            });
        }
        
        if (isNaN(minPoints) || minPoints < 0 || minPoints > 100) {
            return res.status(400).json({ 
                error: 'Minimum points must be between 0 and 100' 
            });
        }
        
        if (minPoints >= maxPoints) {
            return res.status(400).json({ 
                error: 'Minimum points must be less than maximum points' 
            });
        }
        
        const settings = await SystemSettings.getSettings();
        
        settings.maxPointsPerService = maxPoints;
        settings.minPointsPerService = minPoints;
        settings.updatedBy = req.session.userId;
        
        await settings.save();
        
        console.log('✅ Points settings updated by Super Admin');
        console.log('   Max Points:', maxPoints);
        console.log('   Min Points:', minPoints);
        
        res.json({ 
            success: true,
            message: 'Points settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating points settings:', error);
        res.status(500).json({ 
            error: 'Error updating points settings' 
        });
    }
};

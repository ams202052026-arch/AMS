const User = require('../models/user');
const Appointment = require('../models/appointment');
const Notification = require('../models/notification');
const { Redemption } = require('../models/reward');

// Load profile page
exports.loadProfile = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.redirect('/login');
        }

        res.render('profile', { 
            customer: user, // Keep 'customer' for view compatibility
            user: user, // Also provide as 'user'
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading profile' });
    }
};

// Profile information is read-only (no update function needed)

// Change password
exports.changePassword = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.redirect('/profile?error=All password fields are required');
        }

        if (newPassword !== confirmPassword) {
            return res.redirect('/profile?error=New passwords do not match');
        }

        if (newPassword.length < 6) {
            return res.redirect('/profile?error=New password must be at least 6 characters');
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('/login');
        }

        // Verify current password (plain text comparison)
        // TODO: Use bcrypt.compare in production
        if (user.password !== currentPassword) {
            return res.redirect('/profile?error=Current password is incorrect');
        }

        // Update password (store as plain text to match existing system)
        // TODO: Hash with bcrypt in production
        await User.findByIdAndUpdate(userId, {
            password: newPassword
        });

        console.log('✅ Password changed for user:', user.email);
        res.redirect('/profile?success=Password changed successfully');
    } catch (error) {
        console.error('❌ Error changing password:', error);
        res.redirect('/profile?error=Error changing password');
    }
};

// Delete account
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { password, confirmText } = req.body;

        // Validate confirmation text
        if (confirmText !== 'DELETE') {
            return res.redirect('/profile?error=Please type DELETE to confirm');
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('/login');
        }

        // Verify password (plain text comparison)
        // TODO: Use bcrypt.compare in production
        if (user.password !== password) {
            return res.redirect('/profile?error=Incorrect password');
        }

        console.log('🗑️ Deleting account for:', user.email);

        // Delete all related data
        await Appointment.deleteMany({ customer: userId });
        await Notification.deleteMany({ customer: userId });
        await Redemption.deleteMany({ customer: userId });
        await User.findByIdAndDelete(userId);

        // Destroy session
        req.session.destroy();

        console.log('✅ Account deleted successfully');
        res.redirect('/?deleted=true');
    } catch (error) {
        console.error('❌ Error deleting account:', error);
        res.redirect('/profile?error=Error deleting account');
    }
};

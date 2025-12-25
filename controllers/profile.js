const User = require('../models/user');
const Appointment = require('../models/appointment');
const Notification = require('../models/notification');
const { Redemption } = require('../models/reward');
const Business = require('../models/business');
const Service = require('../models/service');
const Staff = require('../models/staff');

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
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // 1. Delete user's appointments (as customer)
        const deletedAppointments = await Appointment.deleteMany({ customer: userId });
        console.log(`   ✓ Deleted ${deletedAppointments.deletedCount} appointments (as customer)`);

        // 2. Delete user's notifications
        const deletedNotifications = await Notification.deleteMany({ customer: userId });
        console.log(`   ✓ Deleted ${deletedNotifications.deletedCount} notifications`);

        // 3. Delete user's redemptions
        const deletedRedemptions = await Redemption.deleteMany({ customer: userId });
        console.log(`   ✓ Deleted ${deletedRedemptions.deletedCount} redemptions`);

        // 4. Check if user owns a business
        const ownedBusiness = await Business.findOne({ ownerId: userId });
        
        if (ownedBusiness) {
            console.log(`   📦 Found owned business: ${ownedBusiness.businessName}`);
            
            // 4a. Delete all appointments to this business
            const businessAppointments = await Appointment.deleteMany({ businessId: ownedBusiness._id });
            console.log(`   ✓ Deleted ${businessAppointments.deletedCount} appointments (to business)`);
            
            // 4b. Delete all services from this business
            const businessServices = await Service.deleteMany({ businessId: ownedBusiness._id });
            console.log(`   ✓ Deleted ${businessServices.deletedCount} services`);
            
            // 4c. Delete all staff from this business
            const businessStaff = await Staff.deleteMany({ businessId: ownedBusiness._id });
            console.log(`   ✓ Deleted ${businessStaff.deletedCount} staff members`);
            
            // 4d. Delete the business itself
            await Business.findByIdAndDelete(ownedBusiness._id);
            console.log(`   ✓ Deleted business: ${ownedBusiness.businessName}`);
        } else {
            console.log('   ℹ️  No business owned by this user');
        }

        // 5. Delete the user account
        await User.findByIdAndDelete(userId);
        console.log(`   ✓ Deleted user account: ${user.email}`);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Account and all related data deleted successfully\n');

        // Destroy session
        req.session.destroy();

        res.redirect('/?deleted=true');
    } catch (error) {
        console.error('❌ Error deleting account:', error);
        res.redirect('/profile?error=Error deleting account');
    }
};

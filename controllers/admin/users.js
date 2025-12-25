/**
 * Admin User Management Controller
 * Handles user listing, viewing, banning, and management
 */

const User = require('../../models/user');
const Business = require('../../models/business');
const Appointment = require('../../models/appointment');

/**
 * List All Users
 */
exports.listUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20;
        const skip = (page - 1) * limit;
        
        // Get filter parameters
        const role = req.query.role || 'all';
        const status = req.query.status || 'all';
        const search = req.query.search || '';
        const hasBusinessFilter = req.query.hasBusiness || 'all';
        
        // Build query
        let query = { role: { $ne: 'super_admin' } }; // Exclude super admins
        
        if (role !== 'all') {
            query.role = role;
        }
        
        if (status === 'active') {
            query.isActive = true;
            query.isBanned = false;
        } else if (status === 'inactive') {
            query.isActive = false;
        } else if (status === 'banned') {
            query.isBanned = true;
        }
        
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Get users with pagination
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        // For each user, check if they have a business
        const usersWithBusinessInfo = await Promise.all(users.map(async (user) => {
            const business = await Business.findOne({ ownerId: user._id });
            return {
                ...user.toObject(),
                hasBusiness: !!business,
                businessStatus: business?.verificationStatus || null
            };
        }));
        
        // Apply business filter if needed
        let filteredUsers = usersWithBusinessInfo;
        if (hasBusinessFilter === 'with_business') {
            filteredUsers = usersWithBusinessInfo.filter(u => u.hasBusiness);
        } else if (hasBusinessFilter === 'without_business') {
            filteredUsers = usersWithBusinessInfo.filter(u => !u.hasBusiness);
        }
        
        const totalUsers = await User.countDocuments(query);
        const totalPages = Math.ceil(totalUsers / limit);
        
        // Get statistics (exclude super_admin from all counts)
        const stats = {
            totalCustomers: await User.countDocuments({ role: 'customer' }),
            totalBusinessOwners: await User.countDocuments({ role: 'business_owner' }),
            customersWithBusiness: (await Promise.all(
                (await User.find({ role: 'customer' })).map(async u => {
                    const b = await Business.findOne({ ownerId: u._id });
                    return !!b;
                })
            )).filter(Boolean).length,
            activeUsers: await User.countDocuments({ role: { $ne: 'super_admin' }, isActive: true, isBanned: false }),
            bannedUsers: await User.countDocuments({ role: { $ne: 'super_admin' }, isBanned: true })
        };
        
        res.render('admin/users/list', {
            users: filteredUsers,
            stats,
            currentPage: page,
            totalPages,
            totalUsers,
            filters: { role, status, search, hasBusiness: hasBusinessFilter }
        });
        
    } catch (error) {
        console.error('Error listing users:', error);
        res.status(500).render('error', { message: 'Error loading users' });
    }
};

/**
 * View User Details
 */
exports.viewUserDetails = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Get user details
        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).render('error', { message: 'User not found' });
        }
        
        // Get user's business if they have one
        const business = await Business.findOne({ ownerId: userId });
        
        // Get user's appointment statistics
        const appointmentStats = {
            total: await Appointment.countDocuments({ customer: userId }),
            completed: await Appointment.countDocuments({ customer: userId, status: 'completed' }),
            cancelled: await Appointment.countDocuments({ customer: userId, status: 'cancelled' }),
            pending: await Appointment.countDocuments({ customer: userId, status: 'pending' })
        };
        
        // Get recent appointments
        const recentAppointments = await Appointment.find({ customer: userId })
            .populate('service', 'name')
            .populate('businessId', 'businessName')
            .sort({ createdAt: -1 })
            .limit(10);
        
        // Calculate total spent
        const completedAppointments = await Appointment.find({ 
            customer: userId, 
            status: 'completed' 
        }).populate('service', 'price');
        
        const totalSpent = completedAppointments.reduce((sum, apt) => {
            return sum + (apt.finalPrice || apt.service?.price || 0);
        }, 0);
        
        res.render('admin/users/details', {
            user,
            business,
            appointmentStats,
            recentAppointments,
            totalSpent
        });
        
    } catch (error) {
        console.error('Error viewing user details:', error);
        res.status(500).render('error', { message: 'Error loading user details' });
    }
};

/**
 * Ban User
 */
exports.banUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { reason } = req.body;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.role === 'super_admin') {
            return res.status(403).json({ error: 'Cannot ban super admin' });
        }
        
        // Ban the user
        user.isBanned = true;
        user.banReason = reason || 'Violation of terms and conditions';
        user.bannedAt = new Date();
        await user.save();
        
        console.log(`✓ User banned: ${user.email} - Reason: ${reason}`);
        
        // Automatically suspend user's business if they have one
        const business = await Business.findOne({ ownerId: userId });
        if (business && business.verificationStatus === 'approved') {
            business.verificationStatus = 'suspended';
            business.suspensionReason = `Owner account banned: ${reason || 'Violation of terms and conditions'}`;
            business.suspendedAt = new Date();
            await business.save();
            
            console.log(`✓ Business automatically suspended: ${business.businessName}`);
        }
        
        res.json({ 
            success: true, 
            message: 'User has been banned successfully' + (business ? ' and their business has been suspended' : '')
        });
        
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({ error: 'Failed to ban user' });
    }
};

/**
 * Unban User
 */
exports.unbanUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Unban the user
        user.isBanned = false;
        user.banReason = null;
        user.bannedAt = null;
        await user.save();
        
        console.log(`✓ User unbanned: ${user.email}`);
        
        // Automatically reactivate user's business if it was suspended due to ban
        const business = await Business.findOne({ ownerId: userId });
        if (business && business.verificationStatus === 'suspended' && 
            business.suspensionReason && business.suspensionReason.includes('Owner account banned')) {
            business.verificationStatus = 'approved';
            business.suspensionReason = null;
            business.suspendedAt = null;
            await business.save();
            
            console.log(`✓ Business automatically reactivated: ${business.businessName}`);
        }
        
        res.json({ 
            success: true, 
            message: 'User has been unbanned successfully' + (business ? ' and their business has been reactivated' : '')
        });
        
    } catch (error) {
        console.error('Error unbanning user:', error);
        res.status(500).json({ error: 'Failed to unban user' });
    }
};

/**
 * Deactivate User
 */
exports.deactivateUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.role === 'super_admin') {
            return res.status(403).json({ error: 'Cannot deactivate super admin' });
        }
        
        user.isActive = false;
        await user.save();
        
        console.log(`✓ User deactivated: ${user.email}`);
        
        res.json({ 
            success: true, 
            message: 'User has been deactivated successfully' 
        });
        
    } catch (error) {
        console.error('Error deactivating user:', error);
        res.status(500).json({ error: 'Failed to deactivate user' });
    }
};

/**
 * Reactivate User
 */
exports.reactivateUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.isActive = true;
        await user.save();
        
        console.log(`✓ User reactivated: ${user.email}`);
        
        res.json({ 
            success: true, 
            message: 'User has been reactivated successfully' 
        });
        
    } catch (error) {
        console.error('Error reactivating user:', error);
        res.status(500).json({ error: 'Failed to reactivate user' });
    }
};

/**
 * Delete User (Hard Delete with Business Data)
 */
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        if (user.role === 'super_admin') {
            return res.status(403).json({ error: 'Cannot delete super admin' });
        }
        
        console.log('🗑️ Admin deleting user:', user.email);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const Appointment = require('../models/appointment');
        const Notification = require('../models/notification');
        const { Redemption } = require('../models/reward');
        const Business = require('../models/business');
        const Service = require('../models/service');
        const Staff = require('../models/staff');

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
        console.log('✅ User and all related data deleted successfully\n');
        
        res.json({ 
            success: true, 
            message: 'User and all related data have been deleted successfully' 
        });
        
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

/**
 * Reset User Password
 */
exports.resetUserPassword = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { newPassword } = req.body;
        
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // TODO: Hash password with bcrypt in production
        user.password = newPassword;
        await user.save();
        
        console.log(`✓ Password reset for user: ${user.email}`);
        
        res.json({ 
            success: true, 
            message: 'Password has been reset successfully' 
        });
        
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

module.exports = exports;

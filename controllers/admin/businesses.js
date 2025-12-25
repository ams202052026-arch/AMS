/**
 * Admin Business Management Controller
 * Handles business verification and management
 */

const Business = require('../../models/business');
const User = require('../../models/user');
const Notification = require('../../models/notification');

/**
 * List all businesses with filters
 */
exports.listBusinesses = async (req, res) => {
    try {
        const { status } = req.query;
        
        let filter = {};
        if (status) {
            filter.verificationStatus = status;
        }
        
        const businesses = await Business.find(filter)
            .populate('ownerId', 'firstName lastName email phoneNumber')
            .sort({ createdAt: -1 });
        
        // Filter out businesses with deleted owners (orphaned businesses)
        const activeBusinesses = businesses.filter(business => business.ownerId !== null);
        
        // Log orphaned businesses for cleanup
        const orphanedBusinesses = businesses.filter(business => business.ownerId === null);
        if (orphanedBusinesses.length > 0) {
            console.log(`⚠️  Found ${orphanedBusinesses.length} orphaned business(es) with deleted owners`);
            orphanedBusinesses.forEach(b => {
                console.log(`   - ${b.businessName} (ID: ${b._id})`);
            });
        }
        
        // Count by status (only active businesses with valid owners)
        const statusCounts = {
            pending: activeBusinesses.filter(b => b.verificationStatus === 'pending').length,
            approved: activeBusinesses.filter(b => b.verificationStatus === 'approved').length,
            rejected: activeBusinesses.filter(b => b.verificationStatus === 'rejected').length,
            suspended: activeBusinesses.filter(b => b.verificationStatus === 'suspended').length
        };
        
        res.render('admin/businesses', {
            businesses: activeBusinesses,
            statusCounts,
            currentFilter: status || 'all'
        });
    } catch (error) {
        console.error('Error listing businesses:', error);
        res.status(500).render('error', { message: 'Error loading businesses' });
    }
};

/**
 * View business details for verification
 */
exports.viewBusinessDetails = async (req, res) => {
    try {
        const { businessId } = req.params;
        
        const business = await Business.findById(businessId)
            .populate('ownerId', 'firstName lastName email phoneNumber createdAt')
            .populate('verifiedBy', 'firstName lastName');
        
        if (!business) {
            return res.status(404).render('error', { message: 'Business not found' });
        }
        
        console.log('WALA PADING IMAGES:', business.verificationDocuments ? business.verificationDocuments.length : 'No documents uploaded yet');
        
        res.render('admin/businessDetails', { business });
    } catch (error) {
        console.error('Error viewing business details:', error);
        res.status(500).render('error', { message: 'Error loading business details' });
    }
};

/**
 * Approve business application
 */
exports.approveBusiness = async (req, res) => {
    try {
        const { businessId } = req.params;
        const adminId = req.session.userId;
        
        const business = await Business.findById(businessId).populate('ownerId');
        
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }
        
        if (business.verificationStatus !== 'pending') {
            return res.status(400).json({ error: 'Business is not pending verification' });
        }
        
        // Update business status
        business.verificationStatus = 'approved';
        business.verifiedAt = new Date();
        business.verifiedBy = adminId;
        business.isActive = true;
        await business.save();
        
        // Update owner's verification status
        await User.findByIdAndUpdate(business.ownerId, {
            isVerified: true
        });
        
        // Send in-app notification to business owner
        await Notification.create({
            customer: business.ownerId._id,
            title: 'Business Approved!',
            message: `Congratulations! Your business "${business.businessName}" has been approved. You can now login and start posting your services.`,
            type: 'business_approved'
        });
        
        // Send email notification
        const emailService = require('../../services/emailService');
        try {
            await emailService.sendBusinessApprovalEmail(business, business.ownerId);
            console.log('✅ Approval email sent successfully');
        } catch (emailError) {
            console.error('❌ Failed to send approval email:', emailError);
            // Continue even if email fails
        }
        
        console.log(`✅ Business approved: ${business.businessName} by admin ${adminId}`);
        
        res.json({ 
            success: true, 
            message: 'Business approved successfully' 
        });
    } catch (error) {
        console.error('Error approving business:', error);
        res.status(500).json({ error: 'Error approving business' });
    }
};

/**
 * Reject business application
 */
exports.rejectBusiness = async (req, res) => {
    try {
        const { businessId } = req.params;
        const { reason } = req.body;
        const adminId = req.session.userId;
        
        console.log('🔍 Reject business request:', { businessId, reason, adminId });
        
        if (!reason || reason.trim() === '') {
            console.log('❌ No rejection reason provided');
            return res.status(400).json({ error: 'Rejection reason is required' });
        }
        
        const business = await Business.findById(businessId).populate('ownerId');
        
        if (!business) {
            console.log('❌ Business not found:', businessId);
            return res.status(404).json({ error: 'Business not found' });
        }
        
        console.log('📋 Business current status:', business.verificationStatus);
        
        if (business.verificationStatus !== 'pending') {
            console.log('❌ Business is not pending verification, current status:', business.verificationStatus);
            return res.status(400).json({ error: 'Business is not pending verification' });
        }
        
        // Update business status
        business.verificationStatus = 'rejected';
        business.rejectionReason = reason;
        business.verifiedBy = adminId;
        business.isActive = false;
        await business.save();
        
        console.log('✅ Business status updated to rejected');
        
        // Send in-app notification to business owner
        try {
            await Notification.create({
                customer: business.ownerId._id,
                title: 'Business Application Rejected',
                message: `Unfortunately, your business application for "${business.businessName}" has been rejected.\n\nReason: ${reason}\n\nYou can reapply with the necessary corrections.`,
                type: 'business_rejected'
            });
            console.log('✅ In-app notification created successfully');
        } catch (notificationError) {
            console.error('❌ Notification creation failed:', notificationError);
            // Continue without failing the whole operation
        }
        
        // Send email notification
        const emailService = require('../../services/emailService');
        try {
            await emailService.sendBusinessRejectionEmail(business, business.ownerId, reason);
            console.log('✅ Rejection email sent successfully');
        } catch (emailError) {
            console.error('❌ Failed to send rejection email:', emailError);
            // Continue even if email fails
        }
        
        console.log(`❌ Business rejected: ${business.businessName} by admin ${adminId}`);
        
        res.json({ 
            success: true, 
            message: 'Business rejected successfully' 
        });
    } catch (error) {
        console.error('Error rejecting business:', error);
        res.status(500).json({ error: 'Error rejecting business' });
    }
};

/**
 * Suspend business
 */
exports.suspendBusiness = async (req, res) => {
    try {
        const { businessId } = req.params;
        const { reason } = req.body;
        const adminId = req.session.userId;
        
        if (!reason || reason.trim() === '') {
            return res.status(400).json({ error: 'Suspension reason is required' });
        }
        
        const business = await Business.findById(businessId);
        
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }
        
        // Update business status
        business.verificationStatus = 'suspended';
        business.suspensionReason = reason;
        business.suspendedAt = new Date();
        business.isActive = false;
        await business.save();
        
        // Deactivate all services of this business
        const Service = require('../../models/service');
        const servicesUpdated = await Service.updateMany(
            { businessId: businessId },
            { $set: { isActive: false } }
        );
        
        console.log(`🔒 Deactivated ${servicesUpdated.modifiedCount} services for suspended business`);
        
        // Send notification to business owner
        await Notification.create({
            customer: business.ownerId,
            title: 'Business Suspended',
            message: `Your business "${business.businessName}" has been suspended.\n\nReason: ${reason}\n\nAll your services have been temporarily deactivated. Please contact support for more information.`,
            type: 'business_suspended'
        });
        
        console.log(`⚠️ Business suspended: ${business.businessName} by admin ${adminId}`);
        
        res.json({ 
            success: true, 
            message: 'Business suspended successfully and all services deactivated' 
        });
    } catch (error) {
        console.error('Error suspending business:', error);
        res.status(500).json({ error: 'Error suspending business' });
    }
};

/**
 * Reactivate suspended business
 */
exports.reactivateBusiness = async (req, res) => {
    try {
        const { businessId } = req.params;
        const adminId = req.session.userId;
        
        const business = await Business.findById(businessId);
        
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }
        
        if (business.verificationStatus !== 'suspended') {
            return res.status(400).json({ error: 'Business is not suspended' });
        }
        
        // Reactivate business
        business.verificationStatus = 'approved';
        business.suspensionReason = null;
        business.suspendedAt = null;
        business.isActive = true;
        await business.save();
        
        // Reactivate all services of this business
        const Service = require('../../models/service');
        const servicesUpdated = await Service.updateMany(
            { businessId: businessId },
            { $set: { isActive: true } }
        );
        
        console.log(`✅ Reactivated ${servicesUpdated.modifiedCount} services for reactivated business`);
        
        // Send notification to business owner
        await Notification.create({
            customer: business.ownerId,
            title: 'Business Reactivated',
            message: `Good news! Your business "${business.businessName}" has been reactivated. All your services are now active again and you can resume your operations.`,
            type: 'business_reactivated'
        });
        
        console.log(`✅ Business reactivated: ${business.businessName} by admin ${adminId}`);
        
        res.json({ 
            success: true, 
            message: 'Business reactivated successfully and all services activated' 
        });
    } catch (error) {
        console.error('Error reactivating business:', error);
        res.status(500).json({ error: 'Error reactivating business' });
    }
};

/**
 * Delete business (permanent)
 */
exports.deleteBusiness = async (req, res) => {
    try {
        const { businessId } = req.params;
        
        const business = await Business.findById(businessId);
        
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }
        
        // TODO: Check if business has active bookings
        // TODO: Delete or reassign services
        // TODO: Handle appointments
        
        // Delete business
        await Business.findByIdAndDelete(businessId);
        
        // Update owner - remove business reference
        await User.findByIdAndUpdate(business.ownerId, {
            businessId: null,
            role: 'customer' // Downgrade to customer
        });
        
        console.log(`🗑️ Business deleted: ${business.businessName}`);
        
        res.json({ 
            success: true, 
            message: 'Business deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting business:', error);
        res.status(500).json({ error: 'Error deleting business' });
    }
};

const Notification = require('../models/notification');

// Get all notifications for customer
exports.getNotifications = async (req, res) => {
    try {
        const customerId = req.session.userId;
        console.log('🔔 Getting notifications for user:', customerId);
        console.log('Session data:', {
            userId: req.session.userId,
            userEmail: req.session.userEmail,
            userRole: req.session.userRole
        });

        if (!customerId) {
            console.log('❌ No user ID in session');
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const notifications = await Notification.find({ customer: customerId })
            .sort({ createdAt: -1 })
            .limit(50);

        console.log(`✅ Found ${notifications.length} notifications for user ${customerId}`);
        res.json({ notifications });
    } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        res.status(500).json({ error: 'Error fetching notifications' });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        await Notification.findByIdAndUpdate(notificationId, { read: true });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating notification' });
    }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
    try {
        const customerId = req.session.userId;
        await Notification.updateMany(
            { customer: customerId, read: false },
            { read: true }
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error updating notifications' });
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const customerId = req.session.userId;
        console.log('🔔 Getting unread count for user:', customerId);

        if (!customerId) {
            console.log('❌ No user ID in session for unread count');
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const count = await Notification.countDocuments({ 
            customer: customerId, 
            read: false 
        });
        
        console.log(`✅ Unread count for user ${customerId}: ${count}`);
        res.json({ count });
    } catch (error) {
        console.error('❌ Error fetching unread count:', error);
        res.status(500).json({ error: 'Error fetching count' });
    }
};

// Delete single notification
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const customerId = req.session.userId;
        
        await Notification.findOneAndDelete({ 
            _id: notificationId, 
            customer: customerId 
        });
        
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting notification' });
    }
};

// Clear all notifications
exports.clearAllNotifications = async (req, res) => {
    try {
        const customerId = req.session.userId;
        await Notification.deleteMany({ customer: customerId });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error clearing notifications' });
    }
};
 
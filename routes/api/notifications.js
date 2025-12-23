const express = require('express');
const router = express.Router();
const notificationsController = require('../../controllers/notifications');
const checkSession = require('../../middleware/checkSession');

// API routes
router.get('/', checkSession, notificationsController.getNotifications);
router.get('/unread-count', checkSession, notificationsController.getUnreadCount);
router.post('/:notificationId/read', checkSession, notificationsController.markAsRead);
router.post('/mark-all-read', checkSession, notificationsController.markAllAsRead);
router.delete('/:notificationId', checkSession, notificationsController.deleteNotification);
router.delete('/', checkSession, notificationsController.clearAllNotifications);

module.exports = router;

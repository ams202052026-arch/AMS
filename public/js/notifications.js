document.addEventListener('DOMContentLoaded', async function() {
    await loadNotifications();
    
    // Mark all as read button
    document.getElementById('markAllRead').addEventListener('click', async function() {
        try {
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'POST'
            });
            
            if (response.ok) {
                await loadNotifications();
                updateNotificationBadge();
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    });

    // Clear all button
    document.getElementById('clearAll').addEventListener('click', function() {
        document.getElementById('clearAllModal').style.display = 'flex';
    });
});

function closeClearAllModal() {
    document.getElementById('clearAllModal').style.display = 'none';
}

async function confirmClearAll() {
    try {
        const response = await fetch('/api/notifications', {
            method: 'DELETE'
        });
        
        if (response.ok) {
            closeClearAllModal();
            await loadNotifications();
            updateNotificationBadge();
        }
    } catch (error) {
        console.error('Error clearing notifications:', error);
    }
}

async function loadNotifications() {
    const container = document.getElementById('notificationsList');
    
    try {
        const response = await fetch('/api/notifications');
        const data = await response.json();
        
        if (data.notifications && data.notifications.length > 0) {
            container.innerHTML = data.notifications.map(notif => `
                <div class="notification-item ${notif.read ? 'read' : 'unread'} ${notif.type}" 
                     data-id="${notif._id}">
                    <div class="notification-content" onclick="markAsRead('${notif._id}')">
                        <div class="notification-body">
                            <h3 class="notification-title">
                                ${notif.title}
                                ${!notif.read ? '<span class="notification-badge-indicator"></span>' : ''}
                            </h3>
                            <p class="notification-message">${notif.message.replace(/\n/g, '<br>')}</p>
                        </div>
                        <span class="notification-time">${formatTime(notif.createdAt)}</span>
                    </div>
                    <button class="btn-delete-notification" onclick="deleteNotification(event, '${notif._id}')" title="Delete notification">
                        <span class="delete-icon">×</span>
                    </button>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="empty-state">No notifications yet</p>';
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = '<p class="empty-state">Error loading notifications</p>';
    }
}

let notificationToDelete = null;

function deleteNotification(event, notificationId) {
    event.stopPropagation();
    notificationToDelete = notificationId;
    document.getElementById('deleteNotificationModal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteNotificationModal').style.display = 'none';
    notificationToDelete = null;
}

async function confirmDeleteNotification() {
    if (!notificationToDelete) return;
    
    try {
        const response = await fetch(`/api/notifications/${notificationToDelete}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from UI with animation
            const notifElement = document.querySelector(`[data-id="${notificationToDelete}"]`);
            if (notifElement) {
                notifElement.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => {
                    notifElement.remove();
                    
                    // Check if list is empty
                    const container = document.getElementById('notificationsList');
                    if (container.children.length === 0) {
                        container.innerHTML = '<p class="empty-state">No notifications yet</p>';
                    }
                }, 300);
            }
            
            updateNotificationBadge();
            closeDeleteModal();
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        closeDeleteModal();
    }
}

async function markAsRead(notificationId) {
    try {
        await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'POST'
        });
        
        // Update UI
        const notifElement = document.querySelector(`[data-id="${notificationId}"]`);
        if (notifElement) {
            notifElement.classList.remove('unread');
            notifElement.classList.add('read');
            const badge = notifElement.querySelector('.notification-badge-indicator');
            if (badge) badge.remove();
        } 
        
        updateNotificationBadge();
    } catch (error) {
        console.error('Error marking as read:', error);
    }
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

async function updateNotificationBadge() {
    try {
        const response = await fetch('/api/notifications/unread-count');
        const data = await response.json();
        const badge = document.getElementById('notificationBadge');
        
        if (badge) {
            if (data.count > 0) {
                badge.textContent = data.count > 99 ? '99+' : data.count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error updating badge:', error);
    }
}

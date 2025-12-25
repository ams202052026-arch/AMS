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
            container.innerHTML = data.notifications.map(notif => {
                // Strip emojis from title and message
                const cleanTitle = stripEmojis(notif.title);
                const cleanMessage = stripEmojis(notif.message);
                
                return `
                    <div class="notification-item ${notif.read ? 'read' : 'unread'} ${notif.type}" 
                         data-id="${notif._id}">
                        <div class="notification-content" onclick="markAsRead('${notif._id}')">
                            <div class="notification-icon">
                                ${getNotificationIcon(notif.type)}
                            </div>
                            <div class="notification-body">
                                <h3 class="notification-title">
                                    ${cleanTitle}
                                    ${!notif.read ? '<span class="notification-badge-indicator"></span>' : ''}
                                </h3>
                                <p class="notification-message">${cleanMessage.replace(/\n/g, '<br>')}</p>
                            </div>
                            <span class="notification-time">${formatTime(notif.createdAt)}</span>
                        </div>
                        <button class="btn-delete-notification" onclick="deleteNotification(event, '${notif._id}')" title="Delete notification">
                            <span class="delete-icon">×</span>
                        </button>
                    </div>
                `;
            }).join('');
        } else {
            container.innerHTML = '<p class="empty-state">No notifications yet</p>';
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        container.innerHTML = '<p class="empty-state">Error loading notifications</p>';
    }
}

function stripEmojis(text) {
    // Remove all emojis and emoji-like characters
    return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]|[\u{FE00}-\u{FE0F}]|[\u{2190}-\u{21FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{2B55}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{00A9}]|[\u{00AE}]|[\u{203C}]|[\u{2049}]|[\u{2122}]|[\u{2139}]|[\u{2194}-\u{2199}]|[\u{21A9}-\u{21AA}]|[\u{231A}-\u{231B}]|[\u{2328}]|[\u{23CF}]|[\u{23ED}-\u{23EF}]|[\u{23F8}-\u{23FA}]|[\u{24C2}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2600}-\u{2604}]|[\u{260E}]|[\u{2611}]|[\u{2614}-\u{2615}]|[\u{2618}]|[\u{261D}]|[\u{2620}]|[\u{2622}-\u{2623}]|[\u{2626}]|[\u{262A}]|[\u{262E}-\u{262F}]|[\u{2638}-\u{263A}]|[\u{2640}]|[\u{2642}]|[\u{2648}-\u{2653}]|[\u{2660}]|[\u{2663}]|[\u{2665}-\u{2666}]|[\u{2668}]|[\u{267B}]|[\u{267F}]|[\u{2692}-\u{2697}]|[\u{2699}]|[\u{269B}-\u{269C}]|[\u{26A0}-\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26B0}-\u{26B1}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26C8}]|[\u{26CE}-\u{26CF}]|[\u{26D1}]|[\u{26D3}-\u{26D4}]|[\u{26E9}-\u{26EA}]|[\u{26F0}-\u{26F5}]|[\u{26F7}-\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu, '').trim();
}

function getNotificationIcon(type) {
    const icons = {
        'appointment_confirm': `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        'reward_update': `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        'business_approved': `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        'business_rejected': `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M9 9L15 15M15 9L9 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `,
        'business_suspended': `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `,
        'business_reactivated': `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M8 12L11 15L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        'reward_redeemed': `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        'default': `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `
    };
    
    return icons[type] || icons['default'];
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

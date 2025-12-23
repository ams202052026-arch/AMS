document.addEventListener('DOMContentLoaded', function() {
    // Dropdown menu functionality
    const menuDropdown = document.querySelector('.menu-dropdown');
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (dropdownToggle && dropdownMenu) {
        // Toggle dropdown on click
        dropdownToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            menuDropdown.classList.toggle('active');
            
            // Add animation class
            if (menuDropdown.classList.contains('active')) {
                dropdownToggle.style.transform = 'rotate(180deg)';
            } else {
                dropdownToggle.style.transform = 'rotate(0deg)';
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!menuDropdown.contains(e.target)) {
                menuDropdown.classList.remove('active');
                dropdownToggle.style.transform = 'rotate(0deg)';
            }
        });

        // Close dropdown on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && menuDropdown.classList.contains('active')) {
                menuDropdown.classList.remove('active');
                dropdownToggle.style.transform = 'rotate(0deg)';
            }
        });

        // Add ripple effect to dropdown items
        const dropdownItems = dropdownMenu.querySelectorAll('a');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                createRipple(e, this);
            });
        });
    }

    // Active navigation highlighting
    const navLinks = document.querySelectorAll('.navigation a');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        
        if (linkPath === currentPath) {
            link.classList.add('active');
        }

        // Add hover effect with micro-interaction
        link.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });

    // Notification icon interaction
    const notificationIcon = document.querySelector('.header-right .nav-icon:first-child');
    if (notificationIcon) {
        notificationIcon.addEventListener('click', function() {
            // Add shake animation
            this.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                this.style.animation = '';
            }, 500);

            // Placeholder for notification functionality
            console.log('Notifications clicked');
            // You can add actual notification logic here
        });
    }

    // Smooth scroll to top when logo is clicked
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Header shadow on scroll
    const header = document.querySelector('.header');
    let lastScroll = 0;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 10) {
            header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
        } else {
            header.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
        }

        lastScroll = currentScroll;
    });

    // Add keyboard navigation for dropdown
    if (dropdownToggle) {
        dropdownToggle.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    }

    // Trap focus in dropdown when open
    if (dropdownMenu) {
        const dropdownLinks = dropdownMenu.querySelectorAll('a');
        
        dropdownMenu.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                const firstLink = dropdownLinks[0];
                const lastLink = dropdownLinks[dropdownLinks.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstLink) {
                        e.preventDefault();
                        lastLink.focus();
                    }
                } else {
                    if (document.activeElement === lastLink) {
                        e.preventDefault();
                        firstLink.focus();
                    }
                }
            }
        });
    }
});

// Ripple effect function
function createRipple(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(0, 0, 0, 0.1)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'rippleEffect 0.6s ease-out';
    ripple.style.pointerEvents = 'none';

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add shake animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
        20%, 40%, 60%, 80% { transform: translateX(3px); }
    }
    
    @keyframes rippleEffect {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);


// Load notification badge count
async function loadNotificationCount() {
    try {
        const response = await fetch('/api/notifications/unread-count');
        const data = await response.json();
        const badge = document.getElementById('notificationBadge');
        
        if (badge && data.count > 0) {
            badge.textContent = data.count > 99 ? '99+' : data.count;
            badge.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}

// Load on page load
document.addEventListener('DOMContentLoaded', loadNotificationCount);

// Refresh every 30 seconds
setInterval(loadNotificationCount, 30000);

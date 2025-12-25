// Switch Mode Modal Functions
function showSwitchModeModal() {
    const modal = document.getElementById('switchModeModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSwitchModeModal() {
    const modal = document.getElementById('switchModeModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function confirmSwitchMode() {
    window.location.href = '/switch-to-customer';
}

// Logout Modal Functions
function showLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function confirmLogout() {
    window.location.href = '/logout';
}

/**
 * Debug Script for Mode Switch Button
 * Add this to test if the button is working
 */

console.log('🔍 Debug Mode Switch Script Loaded');

// Test if button exists
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 DOM Content Loaded - Testing Mode Switch Button');
    
    const modeSwitchBtn = document.querySelector('.mode-switch-btn');
    const modal = document.getElementById('modeSwitchModal');
    
    console.log('Button found:', !!modeSwitchBtn);
    console.log('Modal found:', !!modal);
    
    if (modeSwitchBtn) {
        console.log('Button text:', modeSwitchBtn.textContent);
        console.log('Button onclick:', modeSwitchBtn.onclick);
        
        // Add click event listener for debugging
        modeSwitchBtn.addEventListener('click', function(e) {
            console.log('🔍 Mode Switch Button Clicked!');
            console.log('Event:', e);
            
            // Test modal display
            if (modal) {
                console.log('Modal display before:', modal.style.display);
                modal.style.display = 'flex';
                console.log('Modal display after:', modal.style.display);
                
                // Test API call
                console.log('🔍 Testing API call...');
                fetch('/api/mode-status')
                    .then(response => {
                        console.log('API Response status:', response.status);
                        return response.json();
                    })
                    .then(data => {
                        console.log('API Response data:', data);
                    })
                    .catch(error => {
                        console.error('API Error:', error);
                    });
            } else {
                console.error('❌ Modal not found!');
            }
        });
    } else {
        console.error('❌ Mode Switch Button not found!');
    }
    
    // Test if showModeSwitchModal function exists
    if (typeof showModeSwitchModal === 'function') {
        console.log('✅ showModeSwitchModal function exists');
    } else {
        console.error('❌ showModeSwitchModal function not found!');
    }
    
    // Test modal close functionality
    const closeBtn = modal?.querySelector('.close-btn');
    if (closeBtn) {
        console.log('✅ Close button found');
        closeBtn.addEventListener('click', function() {
            console.log('🔍 Close button clicked');
        });
    }
});

// Override showModeSwitchModal for debugging
window.originalShowModeSwitchModal = window.showModeSwitchModal;
window.showModeSwitchModal = function() {
    console.log('🔍 showModeSwitchModal called');
    
    const modal = document.getElementById('modeSwitchModal');
    if (modal) {
        console.log('Opening modal...');
        modal.style.display = 'flex';
        
        // Call original function if it exists
        if (window.originalShowModeSwitchModal) {
            window.originalShowModeSwitchModal();
        }
    } else {
        console.error('❌ Modal not found in showModeSwitchModal');
    }
};
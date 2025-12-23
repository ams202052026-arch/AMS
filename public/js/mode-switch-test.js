/**
 * Simple Mode Switch Test Script
 * This will help identify exactly where the issue is
 */

console.log('🔍 Mode Switch Test Script Loaded');

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 DOM Ready - Starting Mode Switch Tests');
    
    // Test 1: Check if elements exist
    const button = document.querySelector('.mode-switch-btn');
    const modal = document.getElementById('modeSwitchModal');
    
    console.log('Test 1 - Element Check:');
    console.log('  Button exists:', !!button);
    console.log('  Modal exists:', !!modal);
    
    if (button) {
        console.log('  Button text:', button.textContent.trim());
        console.log('  Button onclick attribute:', button.getAttribute('onclick'));
    }
    
    // Test 2: Check if function exists
    console.log('Test 2 - Function Check:');
    console.log('  showModeSwitchModal exists:', typeof showModeSwitchModal === 'function');
    console.log('  closeModeSwitchModal exists:', typeof closeModeSwitchModal === 'function');
    
    // Test 3: Add manual click listener to button
    if (button) {
        console.log('Test 3 - Adding manual click listener');
        button.addEventListener('click', function(e) {
            console.log('🔍 BUTTON CLICKED! Event:', e);
            console.log('  Event type:', e.type);
            console.log('  Target:', e.target);
            
            // Try to show modal manually
            if (modal) {
                console.log('  Attempting to show modal...');
                modal.style.display = 'flex';
                console.log('  Modal display set to:', modal.style.display);
                
                // Check if modal is actually visible
                const computedStyle = window.getComputedStyle(modal);
                console.log('  Modal computed display:', computedStyle.display);
                console.log('  Modal computed visibility:', computedStyle.visibility);
                console.log('  Modal computed opacity:', computedStyle.opacity);
            }
        });
    }
    
    // Test 4: Test API endpoint
    console.log('Test 4 - Testing API endpoint');
    fetch('/api/mode-status')
        .then(response => {
            console.log('  API Response status:', response.status);
            console.log('  API Response ok:', response.ok);
            return response.json();
        })
        .then(data => {
            console.log('  API Response data:', data);
        })
        .catch(error => {
            console.error('  API Error:', error);
        });
    
    // Test 5: Override showModeSwitchModal function
    console.log('Test 5 - Overriding showModeSwitchModal function');
    window.originalShowModeSwitchModal = window.showModeSwitchModal;
    window.showModeSwitchModal = function() {
        console.log('🔍 showModeSwitchModal called!');
        
        const modal = document.getElementById('modeSwitchModal');
        if (modal) {
            console.log('  Modal found, showing...');
            modal.style.display = 'flex';
            
            // Call original function if it exists
            if (window.originalShowModeSwitchModal && typeof window.originalShowModeSwitchModal === 'function') {
                console.log('  Calling original function...');
                try {
                    window.originalShowModeSwitchModal();
                } catch (error) {
                    console.error('  Error calling original function:', error);
                }
            }
        } else {
            console.error('  Modal not found!');
        }
    };
    
    console.log('🔍 All tests completed. Check console for results.');
});

// Add a global test function
window.testModeSwitch = function() {
    console.log('🧪 Manual Mode Switch Test');
    
    const button = document.querySelector('.mode-switch-btn');
    const modal = document.getElementById('modeSwitchModal');
    
    if (button && modal) {
        console.log('  Simulating button click...');
        button.click();
        
        setTimeout(() => {
            const isVisible = modal.style.display === 'flex';
            console.log('  Modal visible after click:', isVisible);
            
            if (!isVisible) {
                console.log('  Trying manual modal show...');
                modal.style.display = 'flex';
            }
        }, 100);
    } else {
        console.error('  Button or modal not found');
    }
};

console.log('🔍 Test functions loaded. Run testModeSwitch() in console to test manually.');
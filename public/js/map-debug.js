/**
 * Map Debug Script
 * Simple script to test if Google Maps is loading properly
 */

// Check if Google Maps API is loaded
function checkGoogleMapsAPI() {
    console.log('🗺️ Checking Google Maps API...');
    
    if (typeof google !== 'undefined' && google.maps) {
        console.log('✅ Google Maps API loaded successfully');
        console.log('Google Maps version:', google.maps.version);
        return true;
    } else {
        console.log('❌ Google Maps API not loaded');
        return false;
    }
}

// Simple map initialization test
function testMapInitialization() {
    console.log('🧪 Testing map initialization...');
    
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.log('❌ Map element not found');
        return false;
    }
    
    console.log('✅ Map element found');
    console.log('Map element dimensions:', mapElement.offsetWidth, 'x', mapElement.offsetHeight);
    
    try {
        const testMap = new google.maps.Map(mapElement, {
            zoom: 10,
            center: { lat: 14.5995, lng: 120.9842 }
        });
        console.log('✅ Map initialized successfully');
        return true;
    } catch (error) {
        console.log('❌ Map initialization failed:', error);
        return false;
    }
}

// Run diagnostics when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Running map diagnostics...');
    
    // Wait a bit for Google Maps to load
    setTimeout(() => {
        const apiLoaded = checkGoogleMapsAPI();
        if (apiLoaded) {
            testMapInitialization();
        }
    }, 2000);
});

// Global callback for Google Maps API
window.mapDebugCallback = function() {
    console.log('🎯 Google Maps API callback triggered');
    checkGoogleMapsAPI();
};
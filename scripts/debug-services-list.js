/**
 * Debug Services List
 * Check what services exist and their IDs
 */

const axios = require('axios');

async function debugServicesList() {
    try {
        console.log('🔍 Debugging Services List...');
        
        // Login
        const loginResponse = await axios.post('http://localhost:3000/login', {
            email: 'alphi.fidelino@lspu.edu.ph',
            password: 'password123'
        });
        
        console.log('✓ Login successful');
        const cookies = loginResponse.headers['set-cookie'];
        
        // Switch to business mode
        await axios.get('http://localhost:3000/switch-to-business', {
            headers: { 'Cookie': cookies.join('; ') }
        });
        console.log('✓ Switched to business mode');
        
        // Get services list
        const servicesResponse = await axios.get('http://localhost:3000/business-owner/services', {
            headers: { 'Cookie': cookies.join('; ') }
        });
        
        const htmlContent = servicesResponse.data;
        
        // Look for service IDs in various patterns
        const editLinkMatches = htmlContent.match(/\/services\/([a-f0-9]{24})\/edit/g);
        const serviceIdMatches = htmlContent.match(/[a-f0-9]{24}/g);
        
        console.log('\n📋 Services List Analysis:');
        console.log('Edit links found:', editLinkMatches ? editLinkMatches.length : 0);
        console.log('Edit links:', editLinkMatches || 'None');
        
        console.log('\nAll 24-char hex strings (potential service IDs):');
        if (serviceIdMatches) {
            const uniqueIds = [...new Set(serviceIdMatches)];
            uniqueIds.forEach((id, index) => {
                console.log(`${index + 1}. ${id}`);
            });
        } else {
            console.log('None found');
        }
        
        // Save HTML content to file for manual inspection
        const fs = require('fs');
        fs.writeFileSync('debug-services-list.html', htmlContent);
        console.log('\n💾 HTML content saved to debug-services-list.html');
        
        // Look for specific patterns that might indicate services
        const servicePatterns = [
            /service-item/gi,
            /service-card/gi,
            /service-row/gi,
            /data-service-id/gi,
            /service.*id/gi
        ];
        
        console.log('\n🔍 Searching for service-related patterns:');
        servicePatterns.forEach((pattern, index) => {
            const matches = htmlContent.match(pattern);
            console.log(`Pattern ${index + 1} (${pattern}):`, matches ? matches.length : 0, 'matches');
        });
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
        }
    }
}

// Run the debug
debugServicesList();
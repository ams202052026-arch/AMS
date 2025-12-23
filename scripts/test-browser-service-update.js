/**
 * Test Service Update - Browser Simulation
 * Simulates exactly what happens when updating a service through the browser
 */

const axios = require('axios');
const FormData = require('form-data');

async function testBrowserServiceUpdate() {
    try {
        console.log('🧪 Testing Browser Service Update...');
        
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
        
        // Create a service first
        console.log('\n📝 Creating a service to update...');
        const createFormData = new FormData();
        createFormData.append('name', 'Test Service for Browser Update');
        createFormData.append('description', 'This service will be updated via browser simulation');
        createFormData.append('price', '100');
        createFormData.append('duration', '60');
        createFormData.append('category', 'hair');
        createFormData.append('pointsEarned', '10');
        createFormData.append('minAdvanceBookingValue', '1');
        createFormData.append('minAdvanceBookingUnit', 'hours');
        
        await axios.post('http://localhost:3000/business-owner/services', createFormData, {
            headers: {
                ...createFormData.getHeaders(),
                'Cookie': cookies.join('; ')
            }
        });
        console.log('✅ Service created successfully');
        
        // Get services list to find a real service ID
        const servicesResponse = await axios.get('http://localhost:3000/business-owner/services', {
            headers: { 'Cookie': cookies.join('; ') }
        });
        
        // Extract service ID from HTML (simplified approach)
        const htmlContent = servicesResponse.data;
        const serviceIdMatch = htmlContent.match(/\/services\/([a-f0-9]{24})\/edit/);
        
        if (!serviceIdMatch) {
            throw new Error('Could not find a service ID in the services list');
        }
        
        const serviceId = serviceIdMatch[1];
        console.log('✓ Found service ID:', serviceId);
        
        // Now test the update - simulate exactly what the browser form sends
        console.log('\n🔄 Testing service update with real service ID...');
        const updateFormData = new FormData();
        
        // Add all the form fields exactly as the browser would
        updateFormData.append('_method', 'PUT'); // This is the key field
        updateFormData.append('name', 'Updated Service Name - Browser Test');
        updateFormData.append('description', 'This service has been updated via browser simulation');
        updateFormData.append('price', '150');
        updateFormData.append('duration', '90');
        updateFormData.append('category', 'spa');
        updateFormData.append('pointsEarned', '15');
        updateFormData.append('image', ''); // Empty image URL
        updateFormData.append('details', 'Updated service details\\nSecond line of details');
        updateFormData.append('minAdvanceBookingValue', '2');
        updateFormData.append('minAdvanceBookingUnit', 'hours');
        updateFormData.append('isActive', 'true');
        
        // Note: No file is being uploaded, so serviceImage field is empty
        
        console.log('📤 Sending update request to:', `/business-owner/services/${serviceId}`);
        console.log('📋 Form data includes _method:', updateFormData.hasOwnProperty('_method') ? 'YES' : 'NO');
        
        const updateResponse = await axios.post(`http://localhost:3000/business-owner/services/${serviceId}`, updateFormData, {
            headers: {
                ...updateFormData.getHeaders(),
                'Cookie': cookies.join('; ')
            },
            maxRedirects: 0, // Don't follow redirects so we can see the response
            validateStatus: function (status) {
                return status < 400; // Accept any status less than 400
            }
        });
        
        console.log('✅ Service update completed');
        console.log('📊 Response status:', updateResponse.status);
        console.log('📍 Response headers location:', updateResponse.headers.location || 'No redirect');
        
        if (updateResponse.status === 200 || updateResponse.status === 302) {
            console.log('🎉 Service update working correctly!');
        } else {
            console.log('⚠️  Unexpected response status:', updateResponse.status);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('📊 Response status:', error.response.status);
            console.error('📄 Response data (first 200 chars):', 
                typeof error.response.data === 'string' 
                    ? error.response.data.substring(0, 200) 
                    : JSON.stringify(error.response.data).substring(0, 200)
            );
        }
    }
}

// Run the test
testBrowserServiceUpdate();
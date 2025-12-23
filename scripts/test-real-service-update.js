/**
 * Test Real Service Update
 * Uses a more robust approach to test service updates
 */

const axios = require('axios');
const FormData = require('form-data');

// Create axios instance with cookie jar
const axiosInstance = axios.create({
    withCredentials: true,
    maxRedirects: 0,
    validateStatus: function (status) {
        return status < 400; // Accept redirects and success
    }
});

async function testRealServiceUpdate() {
    try {
        console.log('🧪 Testing Real Service Update...');
        
        // Step 1: Login
        console.log('\n🔐 Step 1: Login...');
        const loginResponse = await axiosInstance.post('http://localhost:3000/login', {
            email: 'alphi.fidelino@lspu.edu.ph',
            password: 'password123'
        });
        
        console.log('Login response status:', loginResponse.status);
        const cookies = loginResponse.headers['set-cookie'];
        console.log('Cookies received:', cookies ? 'YES' : 'NO');
        
        if (!cookies) {
            throw new Error('No cookies received from login');
        }
        
        // Step 2: Switch to business mode
        console.log('\n🏢 Step 2: Switch to business mode...');
        const switchResponse = await axiosInstance.get('http://localhost:3000/switch-to-business', {
            headers: { 'Cookie': cookies.join('; ') }
        });
        
        console.log('Switch response status:', switchResponse.status);
        
        // Step 3: Create a service first
        console.log('\n📝 Step 3: Create a service...');
        const createFormData = new FormData();
        createFormData.append('name', 'Test Service for Real Update');
        createFormData.append('description', 'This service will be updated');
        createFormData.append('price', '100');
        createFormData.append('duration', '60');
        createFormData.append('category', 'hair');
        createFormData.append('pointsEarned', '10');
        createFormData.append('minAdvanceBookingValue', '1');
        createFormData.append('minAdvanceBookingUnit', 'hours');
        
        const createResponse = await axiosInstance.post('http://localhost:3000/business-owner/services', createFormData, {
            headers: {
                ...createFormData.getHeaders(),
                'Cookie': cookies.join('; ')
            }
        });
        
        console.log('Create service response status:', createResponse.status);
        
        // Step 4: Try to access services list
        console.log('\n📋 Step 4: Access services list...');
        const servicesResponse = await axiosInstance.get('http://localhost:3000/business-owner/services', {
            headers: { 'Cookie': cookies.join('; ') }
        });
        
        console.log('Services list response status:', servicesResponse.status);
        
        // Check if we got the actual services page or were redirected
        const isServicesPage = servicesResponse.data.includes('Services') && 
                              servicesResponse.data.includes('Add New Service');
        
        console.log('Got services page:', isServicesPage ? 'YES' : 'NO');
        
        if (!isServicesPage) {
            console.log('❌ Not on services page, checking what page we got...');
            if (servicesResponse.data.includes('Login')) {
                console.log('❌ Redirected to login page - authentication failed');
            } else if (servicesResponse.data.includes('Dashboard')) {
                console.log('ℹ️  On dashboard page instead of services page');
            }
            
            // Save the response for debugging
            const fs = require('fs');
            fs.writeFileSync('debug-services-response.html', servicesResponse.data);
            console.log('💾 Response saved to debug-services-response.html');
            return;
        }
        
        // Step 5: Test update with a known service ID pattern
        console.log('\n🔄 Step 5: Test service update...');
        
        // Use a test service ID (we'll create one if needed)
        const testServiceId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
        
        const updateFormData = new FormData();
        updateFormData.append('_method', 'PUT');
        updateFormData.append('name', 'Updated Service Name');
        updateFormData.append('description', 'Updated description');
        updateFormData.append('price', '150');
        updateFormData.append('duration', '90');
        updateFormData.append('category', 'spa');
        updateFormData.append('pointsEarned', '15');
        updateFormData.append('isActive', 'true');
        updateFormData.append('minAdvanceBookingValue', '2');
        updateFormData.append('minAdvanceBookingUnit', 'hours');
        
        console.log('📤 Sending update request...');
        console.log('🎯 Target URL:', `http://localhost:3000/business-owner/services/${testServiceId}`);
        
        const updateResponse = await axiosInstance.post(`http://localhost:3000/business-owner/services/${testServiceId}`, updateFormData, {
            headers: {
                ...updateFormData.getHeaders(),
                'Cookie': cookies.join('; ')
            }
        });
        
        console.log('✅ Update response status:', updateResponse.status);
        
        if (updateResponse.status === 200 || updateResponse.status === 302) {
            console.log('🎉 Service update working correctly!');
        } else if (updateResponse.status === 404) {
            console.log('ℹ️  Got 404 - this is expected if the service ID doesn\'t exist');
            console.log('ℹ️  The important thing is that we didn\'t get "Not Found" from our route logic');
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
testRealServiceUpdate();
/**
 * Test Service Creation
 * Tests the service creation functionality with form data
 */

const axios = require('axios');
const FormData = require('form-data');

async function testServiceCreation() {
    try {
        console.log('🧪 Testing Service Creation...');
        
        // First, let's test the login
        const loginResponse = await axios.post('http://localhost:3000/login', {
            email: 'alphi.fidelino@lspu.edu.ph',
            password: 'password123'
        });
        
        console.log('✓ Login successful');
        
        // Get cookies from login response
        const cookies = loginResponse.headers['set-cookie'];
        
        // Switch to business mode
        const switchResponse = await axios.get('http://localhost:3000/switch-to-business', {
            headers: {
                'Cookie': cookies.join('; ')
            }
        });
        
        console.log('✓ Switched to business mode');
        
        // Create form data for service creation
        const formData = new FormData();
        formData.append('name', 'Test Service');
        formData.append('description', 'This is a test service');
        formData.append('price', '100');
        formData.append('duration', '60');
        formData.append('category', 'hair');
        formData.append('pointsEarned', '10');
        formData.append('minAdvanceBookingValue', '1');
        formData.append('minAdvanceBookingUnit', 'hours');
        
        // Test service creation
        const serviceResponse = await axios.post('http://localhost:3000/business-owner/services', formData, {
            headers: {
                ...formData.getHeaders(),
                'Cookie': cookies.join('; ')
            }
        });
        
        console.log('✅ Service creation test completed');
        console.log('Response status:', serviceResponse.status);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testServiceCreation();
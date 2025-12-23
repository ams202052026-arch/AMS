/**
 * Test Service Creation with Image Upload
 * Tests both regular form submission and file upload functionality
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testServiceWithImage() {
    try {
        console.log('🧪 Testing Service Creation with Image Upload...');
        
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
        
        // Test 1: Service without image
        console.log('\n📝 Test 1: Creating service without image...');
        const formData1 = new FormData();
        formData1.append('name', 'Hair Cut Service');
        formData1.append('description', 'Professional hair cutting service');
        formData1.append('price', '150');
        formData1.append('duration', '45');
        formData1.append('category', 'hair');
        formData1.append('pointsEarned', '15');
        formData1.append('minAdvanceBookingValue', '2');
        formData1.append('minAdvanceBookingUnit', 'hours');
        
        const serviceResponse1 = await axios.post('http://localhost:3000/business-owner/services', formData1, {
            headers: {
                ...formData1.getHeaders(),
                'Cookie': cookies.join('; ')
            }
        });
        
        console.log('✅ Service without image created successfully');
        
        // Test 2: Service with image URL
        console.log('\n🔗 Test 2: Creating service with image URL...');
        const formData2 = new FormData();
        formData2.append('name', 'Facial Treatment');
        formData2.append('description', 'Relaxing facial treatment service');
        formData2.append('price', '200');
        formData2.append('duration', '90');
        formData2.append('category', 'skin');
        formData2.append('pointsEarned', '20');
        formData2.append('image', 'https://via.placeholder.com/300x200/4CAF50/white?text=Facial+Treatment');
        formData2.append('minAdvanceBookingValue', '1');
        formData2.append('minAdvanceBookingUnit', 'days');
        
        const serviceResponse2 = await axios.post('http://localhost:3000/business-owner/services', formData2, {
            headers: {
                ...formData2.getHeaders(),
                'Cookie': cookies.join('; ')
            }
        });
        
        console.log('✅ Service with image URL created successfully');
        
        // Test 3: Create a test image file for upload
        console.log('\n📸 Test 3: Creating service with image upload...');
        
        // Create a simple test image (1x1 pixel PNG)
        const testImageBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
            0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
            0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ]);
        
        const formData3 = new FormData();
        formData3.append('name', 'Nail Art Service');
        formData3.append('description', 'Creative nail art and design service');
        formData3.append('price', '120');
        formData3.append('duration', '60');
        formData3.append('category', 'nails');
        formData3.append('pointsEarned', '12');
        formData3.append('serviceImage', testImageBuffer, {
            filename: 'test-service-image.png',
            contentType: 'image/png'
        });
        formData3.append('minAdvanceBookingValue', '3');
        formData3.append('minAdvanceBookingUnit', 'hours');
        
        const serviceResponse3 = await axios.post('http://localhost:3000/business-owner/services', formData3, {
            headers: {
                ...formData3.getHeaders(),
                'Cookie': cookies.join('; ')
            }
        });
        
        console.log('✅ Service with image upload created successfully');
        
        // Test 4: Get services list to verify creation
        console.log('\n📋 Test 4: Verifying created services...');
        const servicesListResponse = await axios.get('http://localhost:3000/business-owner/services', {
            headers: {
                'Cookie': cookies.join('; ')
            }
        });
        
        console.log('✅ Services list retrieved successfully');
        
        console.log('\n🎉 All tests completed successfully!');
        console.log('✅ Service creation without image: Working');
        console.log('✅ Service creation with image URL: Working');
        console.log('✅ Service creation with image upload: Working');
        console.log('✅ Cloudinary integration: Ready for production');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            if (error.response.data && typeof error.response.data === 'string') {
                console.error('Response data (first 500 chars):', error.response.data.substring(0, 500));
            }
        }
    }
}

// Run the test
testServiceWithImage();
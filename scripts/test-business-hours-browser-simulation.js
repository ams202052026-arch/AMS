/**
 * Browser Simulation Test for Business Hours
 * Tests the exact HTTP request that the browser makes
 */

const fetch = require('node-fetch');
require('dotenv').config();

async function testBusinessHoursBrowserSimulation() {
    try {
        console.log('🌐 Testing business hours form like a browser...');

        // First, we need to login to get a session
        console.log('Step 1: Logging in to get session...');
        
        const loginResponse = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                email: 'alphi.fidelino@lspu.edu.ph',
                password: 'alphi112411123'
            })
        });

        console.log('Login response status:', loginResponse.status);
        
        // Get cookies from login response
        const cookies = loginResponse.headers.get('set-cookie');
        console.log('Cookies received:', cookies ? 'Yes' : 'No');

        if (!cookies) {
            console.log('❌ No session cookies received from login');
            return;
        }

        // Extract session cookie
        const sessionCookie = cookies.split(';')[0];
        console.log('Session cookie:', sessionCookie);

        // Step 2: Test business hours form submission
        console.log('\nStep 2: Submitting business hours form...');

        const businessHoursData = {
            businessHours: {
                monday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
                tuesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
                wednesday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
                thursday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
                friday: { isOpen: true, openTime: '08:00', closeTime: '17:00' },
                saturday: { isOpen: true, openTime: '09:00', closeTime: '15:00' },
                sunday: { isOpen: false, openTime: '09:00', closeTime: '17:00' }
            }
        };

        console.log('Sending data:', JSON.stringify(businessHoursData, null, 2));

        const businessHoursResponse = await fetch('http://localhost:3000/business-owner/business-hours', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            },
            body: JSON.stringify(businessHoursData)
        });

        console.log('Business hours response status:', businessHoursResponse.status);
        
        const responseText = await businessHoursResponse.text();
        console.log('Response body:', responseText);

        try {
            const responseJson = JSON.parse(responseText);
            console.log('Parsed response:', responseJson);
            
            if (responseJson.success) {
                console.log('✅ Business hours updated successfully via HTTP!');
            } else {
                console.log('❌ Business hours update failed:', responseJson.error);
            }
        } catch (parseError) {
            console.log('❌ Could not parse response as JSON');
            console.log('Raw response:', responseText);
        }

        // Step 3: Test Set Default Hours
        console.log('\nStep 3: Testing Set Default Hours...');

        const defaultHoursData = {
            businessHours: {
                monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                thursday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                friday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                saturday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
                sunday: { isOpen: false, openTime: '09:00', closeTime: '18:00' }
            }
        };

        const defaultHoursResponse = await fetch('http://localhost:3000/business-owner/business-hours', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            },
            body: JSON.stringify(defaultHoursData)
        });

        console.log('Default hours response status:', defaultHoursResponse.status);
        
        const defaultResponseText = await defaultHoursResponse.text();
        console.log('Default hours response:', defaultResponseText);

        console.log('\n✅ Browser simulation test completed!');

    } catch (error) {
        console.error('❌ Browser simulation test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testBusinessHoursBrowserSimulation();
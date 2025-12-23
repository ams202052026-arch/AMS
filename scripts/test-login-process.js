/**
 * Test Login Process
 * Tests the login process to see if session variables are set correctly
 */

const fetch = require('node-fetch');
require('dotenv').config();

async function testLoginProcess() {
    try {
        console.log('🔐 Testing login process...');

        // Test login
        console.log('Step 1: Attempting login...');
        
        const loginResponse = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                email: 'alphi.fidelino@lspu.edu.ph',
                password: 'alphi112411123'
            }),
            redirect: 'manual' // Don't follow redirects automatically
        });

        console.log('Login response status:', loginResponse.status);
        console.log('Login response headers:', Object.fromEntries(loginResponse.headers.entries()));
        
        // Check if we got a redirect (successful login)
        if (loginResponse.status === 302) {
            const location = loginResponse.headers.get('location');
            console.log('✅ Login successful, redirected to:', location);
            
            // Get cookies from login response
            const cookies = loginResponse.headers.get('set-cookie');
            if (cookies) {
                const sessionCookie = cookies.split(';')[0];
                console.log('Session cookie:', sessionCookie);
                
                // Test accessing business hours page directly
                console.log('\nStep 2: Testing business hours page access...');
                
                const businessHoursPageResponse = await fetch('http://localhost:3000/business-owner/business-hours', {
                    method: 'GET',
                    headers: {
                        'Cookie': sessionCookie
                    },
                    redirect: 'manual'
                });
                
                console.log('Business hours page response status:', businessHoursPageResponse.status);
                
                if (businessHoursPageResponse.status === 200) {
                    console.log('✅ Business hours page accessible');
                    
                    // Now test the POST request
                    console.log('\nStep 3: Testing business hours form submission...');
                    
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

                    const formResponse = await fetch('http://localhost:3000/business-owner/business-hours', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Cookie': sessionCookie
                        },
                        body: JSON.stringify(businessHoursData)
                    });

                    console.log('Form submission response status:', formResponse.status);
                    const responseText = await formResponse.text();
                    
                    try {
                        const responseJson = JSON.parse(responseText);
                        console.log('✅ Form submission successful:', responseJson);
                    } catch (e) {
                        console.log('❌ Form submission failed, response:', responseText.substring(0, 200) + '...');
                    }
                    
                } else if (businessHoursPageResponse.status === 302) {
                    const redirectLocation = businessHoursPageResponse.headers.get('location');
                    console.log('❌ Business hours page redirected to:', redirectLocation);
                } else {
                    console.log('❌ Business hours page returned status:', businessHoursPageResponse.status);
                }
                
            } else {
                console.log('❌ No session cookies received');
            }
        } else {
            console.log('❌ Login failed with status:', loginResponse.status);
            const responseText = await loginResponse.text();
            console.log('Response:', responseText.substring(0, 200) + '...');
        }

        console.log('\n✅ Login process test completed!');

    } catch (error) {
        console.error('❌ Login process test failed:', error);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testLoginProcess();
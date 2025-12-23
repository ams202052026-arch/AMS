/**
 * Final Business Hours Form Test
 * Tests the form submission with proper authentication
 */

const fetch = require('node-fetch');
require('dotenv').config();

async function testBusinessHoursFormFinal() {
    try {
        console.log('🔧 Testing business hours form with proper authentication...');

        // Step 1: Login
        console.log('Step 1: Logging in...');
        const loginResponse = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                email: 'alphi.fidelino@lspu.edu.ph',
                password: 'alphi112411123'
            }),
            redirect: 'manual'
        });

        if (loginResponse.status !== 302) {
            console.log('❌ Login failed');
            return;
        }

        const cookies = loginResponse.headers.get('set-cookie');
        const sessionCookie = cookies.split(';')[0];
        console.log('✅ Login successful');

        // Step 2: Switch to business mode
        console.log('Step 2: Switching to business mode...');
        const switchResponse = await fetch('http://localhost:3000/switch-to-business', {
            method: 'GET',
            headers: {
                'Cookie': sessionCookie
            },
            redirect: 'manual'
        });

        console.log('Switch response status:', switchResponse.status);
        
        // Get updated cookies after mode switch
        const newCookies = switchResponse.headers.get('set-cookie');
        const updatedSessionCookie = newCookies ? newCookies.split(';')[0] : sessionCookie;

        // Step 3: Test business hours page access
        console.log('Step 3: Accessing business hours page...');
        const pageResponse = await fetch('http://localhost:3000/business-owner/business-hours', {
            method: 'GET',
            headers: {
                'Cookie': updatedSessionCookie
            }
        });

        console.log('Business hours page response status:', pageResponse.status);
        
        if (pageResponse.status === 200) {
            console.log('✅ Business hours page accessible');
            
            // Step 4: Test form submission
            console.log('Step 4: Testing form submission...');
            
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
                    'Cookie': updatedSessionCookie
                },
                body: JSON.stringify(businessHoursData)
            });

            console.log('Form submission response status:', formResponse.status);
            
            if (formResponse.status === 200) {
                const responseText = await formResponse.text();
                try {
                    const responseJson = JSON.parse(responseText);
                    if (responseJson.success) {
                        console.log('✅ Business hours form submission successful!');
                        console.log('Response:', responseJson.message);
                    } else {
                        console.log('❌ Form submission failed:', responseJson.error);
                    }
                } catch (e) {
                    console.log('❌ Invalid JSON response:', responseText.substring(0, 200));
                }
            } else {
                console.log('❌ Form submission failed with status:', formResponse.status);
            }
            
        } else {
            console.log('❌ Cannot access business hours page');
        }

        console.log('\n✅ Business hours form test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testBusinessHoursFormFinal();
const http = require('http');

// First, we need to login as super admin
const loginData = JSON.stringify({
    email: 'admin@ams.com',
    password: 'admin123'
});

const loginOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/admin/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
    }
};

console.log('🔐 Attempting to login as super admin...');

const loginReq = http.request(loginOptions, (loginRes) => {
    console.log(`Login Status Code: ${loginRes.statusCode}`);
    
    // Get session cookie
    const cookies = loginRes.headers['set-cookie'];
    console.log('Cookies:', cookies);
    
    let body = '';
    loginRes.on('data', (chunk) => {
        body += chunk;
    });
    
    loginRes.on('end', () => {
        if (loginRes.statusCode === 302 || loginRes.statusCode === 200) {
            console.log('✓ Login successful');
            
            // Now try to access /admin/users
            const usersOptions = {
                hostname: 'localhost',
                port: 3000,
                path: '/admin/users',
                method: 'GET',
                headers: {
                    'Cookie': cookies ? cookies.join('; ') : ''
                }
            };
            
            console.log('\n📄 Fetching /admin/users page...');
            
            const usersReq = http.request(usersOptions, (usersRes) => {
                console.log(`Users Page Status Code: ${usersRes.statusCode}`);
                console.log('Content-Type:', usersRes.headers['content-type']);
                
                let usersBody = '';
                usersRes.on('data', (chunk) => {
                    usersBody += chunk;
                });
                
                usersRes.on('end', () => {
                    console.log('\n📊 Response length:', usersBody.length, 'bytes');
                    
                    if (usersBody.length < 100) {
                        console.log('⚠️  Response is too short! Content:');
                        console.log(usersBody);
                    } else {
                        console.log('✓ Page loaded successfully');
                        console.log('First 500 characters:');
                        console.log(usersBody.substring(0, 500));
                    }
                    
                    process.exit(0);
                });
            });
            
            usersReq.on('error', (error) => {
                console.error('❌ Error fetching users page:', error);
                process.exit(1);
            });
            
            usersReq.end();
        } else {
            console.log('❌ Login failed');
            console.log('Response:', body);
            process.exit(1);
        }
    });
});

loginReq.on('error', (error) => {
    console.error('❌ Login error:', error);
    process.exit(1);
});

loginReq.write(loginData);
loginReq.end();

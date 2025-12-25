const http = require('http');

console.log('🧪 Testing Add Reward Page...\n');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/admin/rewards/add',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('📊 Response Status:', res.statusCode);
        console.log('📄 Content-Type:', res.headers['content-type']);
        console.log('📏 Content Length:', data.length, 'bytes\n');

        if (res.statusCode === 200) {
            console.log('✅ Page loaded successfully!');
            
            // Check for key elements
            const checks = [
                { name: 'DOCTYPE', test: data.includes('<!DOCTYPE html>') },
                { name: 'Title', test: data.includes('Add New Reward') },
                { name: 'Form element', test: data.includes('<form') },
                { name: 'Name input', test: data.includes('name="name"') },
                { name: 'Description textarea', test: data.includes('name="description"') },
                { name: 'Points input', test: data.includes('name="pointsRequired"') },
                { name: 'Discount type select', test: data.includes('name="discountType"') },
                { name: 'Discount value input', test: data.includes('name="discountValue"') },
                { name: 'Submit button', test: data.includes('Create Reward') },
                { name: 'Cancel button', test: data.includes('Cancel') },
                { name: 'Preview section', test: data.includes('PREVIEW') },
                { name: 'Back button', test: data.includes('Back to Rewards') },
                { name: 'Live preview script', test: data.includes('updatePreview') }
            ];

            console.log('\n📋 Content Checks:');
            console.log('='.repeat(50));
            checks.forEach(check => {
                const status = check.test ? '✅' : '❌';
                console.log(`${status} ${check.name}`);
            });

            const allPassed = checks.every(check => check.test);
            
            if (allPassed) {
                console.log('\n🎉 All checks passed! The add reward page is working correctly.');
            } else {
                console.log('\n⚠️  Some checks failed. Please review the page.');
            }
        } else if (res.statusCode === 302) {
            console.log('🔄 Redirected to:', res.headers.location);
            console.log('⚠️  You may need to log in first.');
            console.log('\n📝 Steps to test:');
            console.log('1. Get admin access link: node scripts/show-permanent-admin-link.js');
            console.log('2. Open the link and log in');
            console.log('3. Navigate to: http://localhost:3000/admin/rewards/add');
        } else {
            console.log('❌ Unexpected status code');
            console.log('Response preview:', data.substring(0, 200));
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure the server is running:');
    console.log('   npm start');
});

req.end();

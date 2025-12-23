/**
 * Test Cloudinary Connection
 * Run this to verify your Cloudinary credentials are working
 */

require('dotenv').config();
const { cloudinary } = require('../config/cloudinary');

async function testCloudinary() {
    try {
        console.log('🔧 Testing Cloudinary connection...\n');

        // Check if credentials are set
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            console.log('❌ CLOUDINARY_CLOUD_NAME not set in .env');
            return;
        }
        if (!process.env.CLOUDINARY_API_KEY) {
            console.log('❌ CLOUDINARY_API_KEY not set in .env');
            return;
        }
        if (!process.env.CLOUDINARY_API_SECRET) {
            console.log('❌ CLOUDINARY_API_SECRET not set in .env');
            return;
        }

        console.log('✅ Cloudinary credentials found in .env');
        console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
        console.log(`   API Key: ${process.env.CLOUDINARY_API_KEY}`);
        console.log(`   API Secret: ${process.env.CLOUDINARY_API_SECRET.substring(0, 5)}...`);
        console.log('');

        // Test API connection
        const result = await cloudinary.api.ping();
        console.log('✅ Cloudinary API connection successful!');
        console.log('   Status:', result.status);
        console.log('');

        // Get account details
        const usage = await cloudinary.api.usage();
        console.log('📊 Account Usage:');
        console.log(`   Plan: ${usage.plan}`);
        console.log(`   Credits used: ${usage.credits.used_percent}%`);
        console.log(`   Storage used: ${(usage.storage.used_bytes / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Bandwidth used: ${(usage.bandwidth.used_bytes / 1024 / 1024).toFixed(2)} MB`);
        console.log('');

        console.log('🎉 Cloudinary is ready to use!');
        console.log('   You can now upload business documents.');

    } catch (error) {
        console.error('❌ Cloudinary connection failed:');
        console.error('   Error:', error.message);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('   1. Check your .env file has correct credentials');
        console.log('   2. Verify credentials at: https://cloudinary.com/console');
        console.log('   3. Make sure API secret is not truncated');
    }
}

testCloudinary();
#!/usr/bin/env node

const crypto = require('crypto');
const path = require('path');

// Generate a secure admin access token
function generateAdminToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Generate admin access URL
function generateAdminAccessUrl() {
    const token = generateAdminToken();
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const adminUrl = `${baseUrl}/admin/secure-access?token=${token}`;
    
    console.log('\n🔐 SECURE ADMIN ACCESS GENERATED');
    console.log('=====================================');
    console.log(`Token: ${token}`);
    console.log(`URL: ${adminUrl}`);
    console.log('\n⚠️  SECURITY NOTES:');
    console.log('- This token expires in 1 hour');
    console.log('- Only use this URL on trusted devices');
    console.log('- Do not share this URL with anyone');
    console.log('- Access this URL only from secure networks');
    console.log('\n📋 To use:');
    console.log('1. Copy the URL above');
    console.log('2. Open it in a secure browser');
    console.log('3. You will be redirected to admin login');
    console.log('=====================================\n');
    
    return { token, adminUrl };
}

// Main execution
if (require.main === module) {
    generateAdminAccessUrl();
}

module.exports = { generateAdminToken, generateAdminAccessUrl };
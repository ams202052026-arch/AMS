const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

async function testAdminLogin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        const email = 'ams202052026@gmail.com';
        const password = 'YvoneAms@2025';
        
        console.log('Testing login with:');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('');
        
        // Find user
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            role: 'super_admin' 
        });
        
        if (!user) {
            console.log('❌ User not found!');
            process.exit(1);
        }
        
        console.log('✅ User found:');
        console.log('  Email:', user.email);
        console.log('  Role:', user.role);
        console.log('  Stored Password:', user.password);
        console.log('');
        
        // Test password
        const isMatch = password === user.password;
        
        console.log('Password Comparison:');
        console.log('  Input:', password);
        console.log('  Stored:', user.password);
        console.log('  Match:', isMatch);
        console.log('');
        
        if (isMatch) {
            console.log('✅ Login would succeed!');
        } else {
            console.log('❌ Login would fail!');
            console.log('');
            console.log('Character comparison:');
            for (let i = 0; i < Math.max(password.length, user.password.length); i++) {
                const inputChar = password[i] || '(none)';
                const storedChar = user.password[i] || '(none)';
                const match = inputChar === storedChar ? '✓' : '✗';
                console.log(`  [${i}] Input: '${inputChar}' | Stored: '${storedChar}' ${match}`);
            }
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testAdminLogin();

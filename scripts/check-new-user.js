/**
 * Check New User Details
 * Helps debug login issues
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB\n');

        // Get email from command line or use default
        const email = process.argv[2];
        
        if (!email) {
            console.log('Usage: node scripts/check-new-user.js <email>');
            console.log('\nShowing all non-admin users:\n');
            
            const users = await User.find({ role: { $ne: 'super_admin' } })
                .select('email firstName lastName role isVerified isActive isBanned password')
                .sort({ createdAt: -1 })
                .limit(10);
            
            users.forEach(user => {
                console.log('📧 Email:', user.email);
                console.log('   Name:', user.firstName, user.lastName);
                console.log('   Role:', user.role);
                console.log('   Verified:', user.isVerified);
                console.log('   Active:', user.isActive);
                console.log('   Banned:', user.isBanned);
                console.log('   Password (first 20 chars):', user.password.substring(0, 20) + '...');
                console.log('   Password length:', user.password.length);
                console.log('   Is Hashed?:', user.password.startsWith('$2b$') ? 'YES (bcrypt)' : 'NO (plain text)');
                console.log('');
            });
            
            process.exit(0);
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            console.log('❌ User not found:', email);
            process.exit(1);
        }

        console.log('✓ User found!\n');
        console.log('📧 Email:', user.email);
        console.log('👤 Name:', user.firstName, user.lastName);
        console.log('🎭 Role:', user.role);
        console.log('✅ Verified:', user.isVerified);
        console.log('🟢 Active:', user.isActive);
        console.log('🚫 Banned:', user.isBanned);
        console.log('📅 Created:', user.createdAt);
        console.log('\n🔐 Password Info:');
        console.log('   Length:', user.password.length);
        console.log('   First 30 chars:', user.password.substring(0, 30) + '...');
        console.log('   Is Hashed?:', user.password.startsWith('$2b$') ? 'YES (bcrypt)' : 'NO (plain text)');
        
        if (user.password.startsWith('$2b$')) {
            console.log('\n⚠️  PASSWORD IS HASHED!');
            console.log('   The login controller uses plain text comparison.');
            console.log('   This will cause login to fail.');
            console.log('\n💡 Solution: Update password to plain text for testing:');
            console.log(`   user.password = 'yourpassword';`);
            console.log(`   await user.save();`);
        } else {
            console.log('\n✓ Password is plain text (matches login logic)');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

checkUser();

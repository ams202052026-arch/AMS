/**
 * Cleanup Migration Script
 * 
 * This script removes the partially migrated data so you can run the migration again.
 * 
 * IMPORTANT: Only run this if the migration failed midway!
 * 
 * Usage:
 *   node scripts/cleanup-migration.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-system');
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Cleanup function
const cleanup = async () => {
    console.log('\n🧹 Starting cleanup...\n');
    
    try {
        // Drop new collections created by migration
        console.log('📋 Dropping new collections...');
        
        try {
            await mongoose.connection.db.collection('users').drop();
            console.log('   ✅ Dropped users collection');
        } catch (err) {
            if (err.code === 26) {
                console.log('   ℹ️  users collection does not exist');
            } else {
                throw err;
            }
        }
        
        try {
            await mongoose.connection.db.collection('businesses').drop();
            console.log('   ✅ Dropped businesses collection');
        } catch (err) {
            if (err.code === 26) {
                console.log('   ℹ️  businesses collection does not exist');
            } else {
                throw err;
            }
        }
        
        try {
            await mongoose.connection.db.collection('reviews').drop();
            console.log('   ✅ Dropped reviews collection');
        } catch (err) {
            if (err.code === 26) {
                console.log('   ℹ️  reviews collection does not exist');
            } else {
                throw err;
            }
        }
        
        // Remove businessId from services
        console.log('\n📋 Removing businessId from services...');
        const servicesResult = await mongoose.connection.db.collection('services').updateMany(
            { businessId: { $exists: true } },
            { $unset: { businessId: '' } }
        );
        console.log(`   ✅ Updated ${servicesResult.modifiedCount} services`);
        
        // Remove businessId from appointments
        console.log('\n📋 Removing businessId from appointments...');
        const appointmentsResult = await mongoose.connection.db.collection('appointments').updateMany(
            { businessId: { $exists: true } },
            { $unset: { businessId: '' } }
        );
        console.log(`   ✅ Updated ${appointmentsResult.modifiedCount} appointments`);
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ CLEANUP COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('\nYou can now run the migration script again:');
        console.log('  node scripts/migrate-to-multi-business.js\n');
        
    } catch (error) {
        console.error('\n❌ Cleanup failed:', error);
        console.error('\nError details:', error.message);
        process.exit(1);
    }
};

// Run cleanup
const runCleanup = async () => {
    await connectDB();
    
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  CLEANUP WARNING');
    console.log('='.repeat(60));
    console.log('\nThis script will remove partially migrated data.');
    console.log('Only run this if the migration failed midway!\n');
    console.log('Starting cleanup in 3 seconds...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await cleanup();
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
    process.exit(0);
};

// Execute
runCleanup();

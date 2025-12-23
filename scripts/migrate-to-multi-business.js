/**
 * Migration Script: Single Business to Multi-Business Platform
 * 
 * This script migrates the existing single-business system to a multi-business marketplace.
 * 
 * What it does:
 * 1. Creates a unified User model from existing Customer and Admin models
 * 2. Creates a default "Legacy Business" for existing services
 * 3. Links all existing services to the default business
 * 4. Links all existing appointments to the default business
 * 5. Preserves all existing data (customers, appointments, services, rewards)
 * 
 * IMPORTANT: Backup your database before running this script!
 * 
 * Usage:
 *   node scripts/migrate-to-multi-business.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import OLD models
const Customer = require('../models/customer');
const Admin = require('../models/admin');
const Service = require('../models/service');
const Appointment = require('../models/appointment');
const { Reward } = require('../models/reward'); // Import with destructuring

// Import NEW models
const User = require('../models/user');
const Business = require('../models/business');

// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-system', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// Main migration function
const migrate = async () => {
    console.log('\n🚀 Starting migration to multi-business platform...\n');
    
    try {
        // Step 1: Migrate Customers to Users
        console.log('📋 Step 1: Migrating customers to users...');
        const customers = await Customer.find({});
        console.log(`   Found ${customers.length} customers`);
        
        const customerUsers = [];
        for (const customer of customers) {
            const user = new User({
                _id: customer._id, // Preserve original ID
                firstName: customer.name.split(' ')[0] || customer.name,
                lastName: customer.name.split(' ').slice(1).join(' ') || 'User',
                email: customer.email,
                password: customer.password,
                role: 'customer',
                isVerified: customer.isVerified,
                verificationToken: customer.verificationToken,
                verificationTokenExpires: customer.verificationTokenExpires,
                rewardPoints: customer.rewardPoints || 0,
                appointmentHistory: customer.appointmentHistory || [],
                createdAt: customer.createdAt,
                updatedAt: new Date()
            });
            customerUsers.push(user);
        }
        
        if (customerUsers.length > 0) {
            await User.insertMany(customerUsers, { ordered: false });
            console.log(`   ✅ Migrated ${customerUsers.length} customers to users`);
        }
        
        // Step 2: Migrate Admins to Users
        console.log('\n📋 Step 2: Migrating admins to users...');
        const admins = await Admin.find({});
        console.log(`   Found ${admins.length} admins`);
        
        let superAdminUser = null;
        const adminUsers = [];
        
        for (const admin of admins) {
            const user = new User({
                _id: admin._id, // Preserve original ID
                firstName: admin.username,
                lastName: 'Admin',
                email: admin.email,
                password: admin.password,
                role: admin.role === 'super_admin' ? 'super_admin' : 'super_admin',
                isVerified: true,
                lastLogin: admin.lastLogin,
                createdAt: admin.createdAt,
                updatedAt: new Date()
            });
            adminUsers.push(user);
            
            // Keep track of first super admin for business creation
            if (!superAdminUser) {
                superAdminUser = user;
            }
        }
        
        if (adminUsers.length > 0) {
            await User.insertMany(adminUsers, { ordered: false });
            console.log(`   ✅ Migrated ${adminUsers.length} admins to users`);
        }
        
        // Step 3: Create Default Business
        console.log('\n📋 Step 3: Creating default business for existing services...');
        
        // Use first admin as business owner, or create a system user
        let businessOwnerId;
        if (superAdminUser) {
            businessOwnerId = superAdminUser._id;
        } else {
            // Create a system user if no admin exists
            const systemUser = new User({
                firstName: 'System',
                lastName: 'Administrator',
                email: 'system@servicehub.com',
                password: 'temp_password_change_me',
                role: 'super_admin',
                isVerified: true
            });
            await systemUser.save();
            businessOwnerId = systemUser._id;
            console.log('   ⚠️  Created system admin user');
        }
        
        const defaultBusiness = new Business({
            ownerId: businessOwnerId,
            businessName: 'Legacy Services',
            businessType: 'salon',
            description: 'Original services from the previous system. This business was automatically created during platform migration.',
            email: 'legacy@servicehub.com',
            phoneNumber: '0000-000-0000',
            address: {
                street: 'Legacy Address',
                barangay: 'Legacy Barangay',
                city: 'Legacy City',
                province: 'Legacy Province'
            },
            businessHours: [
                { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
                { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
                { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
                { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
                { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
                { day: 'Saturday', isOpen: true, openTime: '09:00', closeTime: '18:00' },
                { day: 'Sunday', isOpen: false }
            ],
            verificationStatus: 'approved',
            verifiedAt: new Date(),
            verifiedBy: businessOwnerId,
            isActive: true
        });
        
        await defaultBusiness.save();
        console.log(`   ✅ Created default business: ${defaultBusiness.businessName} (ID: ${defaultBusiness._id})`);
        
        // Step 4: Update Services with businessId
        console.log('\n📋 Step 4: Linking services to default business...');
        const services = await Service.find({});
        console.log(`   Found ${services.length} services`);
        
        const serviceUpdateResult = await Service.updateMany(
            { businessId: { $exists: false } },
            { $set: { businessId: defaultBusiness._id } }
        );
        console.log(`   ✅ Updated ${serviceUpdateResult.modifiedCount} services`);
        
        // Update business statistics
        defaultBusiness.totalServices = services.length;
        await defaultBusiness.save();
        
        // Step 5: Update Appointments with businessId
        console.log('\n📋 Step 5: Linking appointments to default business...');
        const appointments = await Appointment.find({});
        console.log(`   Found ${appointments.length} appointments`);
        
        const appointmentUpdateResult = await Appointment.updateMany(
            { businessId: { $exists: false } },
            { $set: { businessId: defaultBusiness._id } }
        );
        console.log(`   ✅ Updated ${appointmentUpdateResult.modifiedCount} appointments`);
        
        // Update business booking statistics
        const completedAppointments = await Appointment.countDocuments({
            businessId: defaultBusiness._id,
            status: 'completed'
        });
        defaultBusiness.totalBookings = appointments.length;
        defaultBusiness.completedBookings = completedAppointments;
        await defaultBusiness.save();
        
        // Step 6: Update Rewards to reference User instead of Customer
        console.log('\n📋 Step 6: Updating reward references...');
        const rewards = await Reward.find({});
        console.log(`   Found ${rewards.length} reward records`);
        console.log('   ℹ️  Reward model already uses customerId, no changes needed');
        
        // Migration Summary
        console.log('\n' + '='.repeat(60));
        console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('\nMigration Summary:');
        console.log(`  • Customers migrated: ${customerUsers.length}`);
        console.log(`  • Admins migrated: ${adminUsers.length}`);
        console.log(`  • Default business created: ${defaultBusiness.businessName}`);
        console.log(`  • Services linked: ${serviceUpdateResult.modifiedCount}`);
        console.log(`  • Appointments linked: ${appointmentUpdateResult.modifiedCount}`);
        console.log(`  • Reward records: ${rewards.length} (no changes needed)`);
        
        console.log('\n⚠️  IMPORTANT NEXT STEPS:');
        console.log('  1. Update authentication controllers to use User model');
        console.log('  2. Update session management for role-based access');
        console.log('  3. Create business owner registration flow');
        console.log('  4. Create super admin dashboard');
        console.log('  5. Update customer views to show multiple businesses');
        console.log('\n📝 Default Business Info:');
        console.log(`  • Business ID: ${defaultBusiness._id}`);
        console.log(`  • Owner ID: ${businessOwnerId}`);
        console.log(`  • Status: ${defaultBusiness.verificationStatus}`);
        console.log(`  • Total Services: ${defaultBusiness.totalServices}`);
        console.log(`  • Total Bookings: ${defaultBusiness.totalBookings}`);
        
        console.log('\n✅ You can now start building the multi-business features!\n');
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error('\nError details:', error.message);
        console.error('\n⚠️  Please check the error and try again.');
        console.error('   Make sure you have backed up your database!');
        process.exit(1);
    }
};

// Run migration
const runMigration = async () => {
    await connectDB();
    
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  DATABASE MIGRATION WARNING');
    console.log('='.repeat(60));
    console.log('\nThis script will modify your database structure.');
    console.log('Make sure you have backed up your database before proceeding!');
    console.log('\nTo backup your database, run:');
    console.log('  mongodump --db=your_db_name --out=./backup\n');
    
    // Auto-proceed after 3 seconds (remove this in production)
    console.log('Starting migration in 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await migrate();
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
    process.exit(0);
};

// Execute
runMigration();

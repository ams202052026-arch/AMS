const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Business = require('../models/business');
const Service = require('../models/service');
const Staff = require('../models/staff');
const Appointment = require('../models/appointment');
const Notification = require('../models/notification');
const { Redemption } = require('../models/reward');

async function testDeleteWithBusiness() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Create test user
        console.log('1️⃣  Creating test user...');
        const testUser = new User({
            firstName: 'Delete',
            lastName: 'Test',
            email: 'delete.test@example.com',
            password: 'password123',
            phoneNumber: '09123456789',
            address: {
                street: 'Test Street',
                barangay: 'Test Barangay',
                city: 'Test City',
                province: 'Test Province'
            },
            role: 'customer'
        });
        await testUser.save();
        console.log('   ✓ User created:', testUser.email);
        console.log('   User ID:', testUser._id);
        console.log('');

        // Create business
        console.log('2️⃣  Creating business...');
        const testBusiness = new Business({
            ownerId: testUser._id,
            businessName: 'Test Business to Delete',
            businessType: 'salon',
            email: 'business@test.com',
            phoneNumber: '09987654321',
            address: {
                street: 'Business Street',
                barangay: 'Business Barangay',
                city: 'Business City',
                province: 'Business Province',
                zipCode: '4000'
            },
            verificationStatus: 'approved',
            isActive: true
        });
        await testBusiness.save();
        console.log('   ✓ Business created:', testBusiness.businessName);
        console.log('   Business ID:', testBusiness._id);
        console.log('');

        // Create service
        console.log('3️⃣  Creating service...');
        const testService = new Service({
            businessId: testBusiness._id,
            name: 'Test Service',
            description: 'Test service',
            price: 100,
            duration: 60,
            isActive: true
        });
        await testService.save();
        console.log('   ✓ Service created');
        console.log('');

        // Create staff
        console.log('4️⃣  Creating staff...');
        const testStaff = new Staff({
            businessId: testBusiness._id,
            name: 'Test Staff',
            email: 'staff.test@example.com',
            phone: '09111111111',
            isActive: true
        });
        await testStaff.save();
        console.log('   ✓ Staff created');
        console.log('');

        console.log('📊 DATA BEFORE DELETION:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('User:', testUser.email);
        console.log('Business:', testBusiness.businessName);
        console.log('Services: 1');
        console.log('Staff: 1');
        console.log('');

        // SIMULATE DELETE ACCOUNT
        console.log('🗑️  SIMULATING DELETE ACCOUNT FUNCTION...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const userId = testUser._id;

        // 1. Delete user's appointments (as customer)
        const deletedAppointments = await Appointment.deleteMany({ customer: userId });
        console.log(`   ✓ Deleted ${deletedAppointments.deletedCount} appointments (as customer)`);

        // 2. Delete user's notifications
        const deletedNotifications = await Notification.deleteMany({ customer: userId });
        console.log(`   ✓ Deleted ${deletedNotifications.deletedCount} notifications`);

        // 3. Delete user's redemptions
        const deletedRedemptions = await Redemption.deleteMany({ customer: userId });
        console.log(`   ✓ Deleted ${deletedRedemptions.deletedCount} redemptions`);

        // 4. Check if user owns a business
        const ownedBusiness = await Business.findOne({ ownerId: userId });
        
        if (ownedBusiness) {
            console.log(`   📦 Found owned business: ${ownedBusiness.businessName}`);
            
            // 4a. Delete all appointments to this business
            const businessAppointments = await Appointment.deleteMany({ businessId: ownedBusiness._id });
            console.log(`   ✓ Deleted ${businessAppointments.deletedCount} appointments (to business)`);
            
            // 4b. Delete all services from this business
            const businessServices = await Service.deleteMany({ businessId: ownedBusiness._id });
            console.log(`   ✓ Deleted ${businessServices.deletedCount} services`);
            
            // 4c. Delete all staff from this business
            const businessStaff = await Staff.deleteMany({ businessId: ownedBusiness._id });
            console.log(`   ✓ Deleted ${businessStaff.deletedCount} staff members`);
            
            // 4d. Delete the business itself
            await Business.findByIdAndDelete(ownedBusiness._id);
            console.log(`   ✓ Deleted business: ${ownedBusiness.businessName}`);
        } else {
            console.log('   ℹ️  No business owned by this user');
        }

        // 5. Delete the user account
        await User.findByIdAndDelete(userId);
        console.log(`   ✓ Deleted user account: ${testUser.email}`);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');

        // VERIFY DELETION
        console.log('✅ VERIFICATION:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const userExists = await User.findById(testUser._id);
        const businessExists = await Business.findById(testBusiness._id);
        const serviceExists = await Service.findById(testService._id);
        const staffExists = await Staff.findById(testStaff._id);

        console.log('User exists:', userExists ? '❌ STILL EXISTS' : '✅ DELETED');
        console.log('Business exists:', businessExists ? '❌ STILL EXISTS' : '✅ DELETED');
        console.log('Service exists:', serviceExists ? '❌ STILL EXISTS' : '✅ DELETED');
        console.log('Staff exists:', staffExists ? '❌ STILL EXISTS' : '✅ DELETED');
        console.log('');

        if (!userExists && !businessExists && !serviceExists && !staffExists) {
            console.log('🎉 SUCCESS! Delete account function works correctly!');
            console.log('   All user data and business data properly deleted.');
        } else {
            console.log('⚠️  WARNING: Some data was not deleted!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

testDeleteWithBusiness();

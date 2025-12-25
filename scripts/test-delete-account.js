const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/user');
const Business = require('../models/business');
const Service = require('../models/service');
const Staff = require('../models/staff');
const Appointment = require('../models/appointment');
const Notification = require('../models/notification');
const { Redemption } = require('../models/reward');

async function testDeleteAccount() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Clean up any existing test data first
        console.log('🧹 Cleaning up any existing test data...');
        await User.deleteOne({ email: 'test.delete@example.com' });
        await Business.deleteOne({ businessName: 'Test Delete Business' });
        await Service.deleteOne({ name: 'Test Service' });
        await Staff.deleteOne({ email: 'staff@test.com' });
        console.log('   ✓ Cleanup complete\n');

        // Create a test user
        console.log('1️⃣  Creating test user...');
        const testUser = new User({
            firstName: 'Test',
            lastName: 'DeleteUser',
            email: 'test.delete@example.com',
            password: 'password123',
            phoneNumber: '09123456789',
            address: {
                street: 'Test Street',
                barangay: 'Test Barangay',
                city: 'Test City',
                province: 'Test Province'
            },
            role: 'customer',
            rewardPoints: 50
        });
        await testUser.save();
        console.log('   ✓ Test user created:', testUser.email);
        console.log('   User ID:', testUser._id);
        console.log('');

        // Create a test business owned by this user
        console.log('2️⃣  Creating test business...');
        const testBusiness = new Business({
            ownerId: testUser._id,
            businessName: 'Test Delete Business',
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
        console.log('   ✓ Test business created:', testBusiness.businessName);
        console.log('   Business ID:', testBusiness._id);
        console.log('');

        // Create test services
        console.log('3️⃣  Creating test services...');
        const testService = new Service({
            businessId: testBusiness._id,
            name: 'Test Service',
            description: 'Test service description',
            price: 100,
            duration: 60,
            isActive: true
        });
        await testService.save();
        console.log('   ✓ Test service created:', testService.name);
        console.log('');

        // Create test staff
        console.log('4️⃣  Creating test staff...');
        const testStaff = new Staff({
            businessId: testBusiness._id,
            name: 'Test Staff',
            email: 'staff@test.com',
            phone: '09111111111',
            isActive: true
        });
        await testStaff.save();
        console.log('   ✓ Test staff created:', testStaff.name);
        console.log('');

        // Create test appointment (as customer)
        console.log('5️⃣  Creating test appointment (as customer)...');
        const testAppointment = new Appointment({
            customer: testUser._id,
            service: testService._id,
            businessId: testBusiness._id,
            staff: testStaff._id,
            date: new Date(),
            timeSlot: { start: '10:00', end: '11:00' },
            status: 'pending'
        });
        await testAppointment.save();
        console.log('   ✓ Test appointment created');
        console.log('');

        // Create test notification
        console.log('6️⃣  Creating test notification...');
        const testNotification = new Notification({
            customer: testUser._id,
            title: 'Test Notification',
            message: 'This is a test notification',
            type: 'appointment_update'
        });
        await testNotification.save();
        console.log('   ✓ Test notification created');
        console.log('');

        // Create test redemption
        console.log('7️⃣  Creating test redemption...');
        const testRedemption = new Redemption({
            customer: testUser._id,
            reward: new mongoose.Types.ObjectId(), // Dummy reward ID
            pointsUsed: 10,
            status: 'active'
        });
        await testRedemption.save();
        console.log('   ✓ Test redemption created');
        console.log('');

        // Show summary before deletion
        console.log('📊 DATA SUMMARY BEFORE DELETION:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('User:', testUser.email);
        console.log('Business:', testBusiness.businessName);
        console.log('Services:', 1);
        console.log('Staff:', 1);
        console.log('Appointments:', 1);
        console.log('Notifications:', 1);
        console.log('Redemptions:', 1);
        console.log('');

        // Simulate delete account process
        console.log('🗑️  SIMULATING DELETE ACCOUNT...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // 1. Delete user's appointments (as customer)
        const deletedAppointments = await Appointment.deleteMany({ customer: testUser._id });
        console.log(`   ✓ Deleted ${deletedAppointments.deletedCount} appointments (as customer)`);

        // 2. Delete user's notifications
        const deletedNotifications = await Notification.deleteMany({ customer: testUser._id });
        console.log(`   ✓ Deleted ${deletedNotifications.deletedCount} notifications`);

        // 3. Delete user's redemptions
        const deletedRedemptions = await Redemption.deleteMany({ customer: testUser._id });
        console.log(`   ✓ Deleted ${deletedRedemptions.deletedCount} redemptions`);

        // 4. Check if user owns a business
        const ownedBusiness = await Business.findOne({ ownerId: testUser._id });
        
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
        }

        // 5. Delete the user account
        await User.findByIdAndDelete(testUser._id);
        console.log(`   ✓ Deleted user account: ${testUser.email}`);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('');

        // Verify deletion
        console.log('✅ VERIFICATION:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const userExists = await User.findById(testUser._id);
        const businessExists = await Business.findById(testBusiness._id);
        const serviceExists = await Service.findById(testService._id);
        const staffExists = await Staff.findById(testStaff._id);
        const appointmentExists = await Appointment.findById(testAppointment._id);
        const notificationExists = await Notification.findById(testNotification._id);
        const redemptionExists = await Redemption.findById(testRedemption._id);

        console.log('User exists:', userExists ? '❌ FAILED' : '✅ DELETED');
        console.log('Business exists:', businessExists ? '❌ FAILED' : '✅ DELETED');
        console.log('Service exists:', serviceExists ? '❌ FAILED' : '✅ DELETED');
        console.log('Staff exists:', staffExists ? '❌ FAILED' : '✅ DELETED');
        console.log('Appointment exists:', appointmentExists ? '❌ FAILED' : '✅ DELETED');
        console.log('Notification exists:', notificationExists ? '❌ FAILED' : '✅ DELETED');
        console.log('Redemption exists:', redemptionExists ? '❌ FAILED' : '✅ DELETED');
        console.log('');

        if (!userExists && !businessExists && !serviceExists && !staffExists && 
            !appointmentExists && !notificationExists && !redemptionExists) {
            console.log('🎉 SUCCESS! All data properly deleted!');
        } else {
            console.log('⚠️  WARNING: Some data was not deleted properly!');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    }
}

testDeleteAccount();

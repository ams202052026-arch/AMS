const mongoose = require('mongoose');
require('dotenv').config();

const Admin = require('../models/admin');
const Customer = require('../models/customer');
const Service = require('../models/service');
const Staff = require('../models/staff');
const { Reward } = require('../models/reward');

const connectDB = require('../config/db');

async function seed() {
    await connectDB();

    // Create default admin
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (!existingAdmin) {
        await Admin.create({
            username: 'admin',
            email: 'admin@ams.com',
            password: 'admin123', // Change in production!
            role: 'super_admin'
        });
        console.log('✓ Admin created (username: admin, password: admin123)');
    }

    // Create sample services
    const services = [
        { name: 'Haircut', description: 'Professional men\'s haircut', details: ['Scissor cut', 'Razor shape-up', 'Styling included'], price: 200, duration: 25, category: 'hair', image: '/image/haircut.jpg', pointsEarned: 20 },
        { name: 'Hair Coloring', description: 'Full hair color treatment', details: ['Color consultation', 'High-quality materials', 'After-care treatment'], price: 850, duration: 90, category: 'hair', image: '/image/hairColor.jpg', pointsEarned: 85 },
        { name: 'Shaving', description: 'Clean professional shave', details: ['Warm towel prep', 'Razor shave', 'Aftershave care'], price: 150, duration: 15, category: 'hair', image: '/image/shave.jpg', pointsEarned: 15 },
        { name: 'Hair Spa', description: 'Relaxing hair treatment', details: ['Scalp massage', 'Moisturizing cream', 'Steam treatment'], price: 500, duration: 45, category: 'spa', image: '/image/hairSpa.jpg', pointsEarned: 50 },
        { name: 'Facial', description: 'Deep cleaning facial', details: ['Steam extraction', 'Mask treatment', 'Face massage'], price: 350, duration: 30, category: 'skin', image: '/image/facial.jpg', pointsEarned: 35 },
        { name: 'Foot Spa', description: 'Foot cleaning & massage', details: ['Foot soak', 'Exfoliation', 'Massage'], price: 300, duration: 40, category: 'spa', image: '/image/footSpa.jpg', pointsEarned: 30 },
        { name: 'Manicure', description: 'Classic manicure service', details: ['Nail cleaning', 'Nail shaping', 'Polish application'], price: 180, duration: 20, category: 'nails', image: '/image/manicure.jpg', pointsEarned: 18 },
        { name: 'Pedicure', description: 'Classic pedicure service', details: ['Nail cleaning', 'Nail trimming', 'Polish application'], price: 200, duration: 25, category: 'nails', image: '/image/pedicure.jpg', pointsEarned: 20 }
    ];

    for (const svc of services) {
        const exists = await Service.findOne({ name: svc.name });
        if (!exists) {
            await Service.create(svc);
            console.log(`✓ Service created: ${svc.name}`);
        }
    }

    // Create sample staff
    const staffMembers = [
        { name: 'Michael Reyes', email: 'michael@ams.com', phone: '09171234567' },
        { name: 'Sarah Lim', email: 'sarah@ams.com', phone: '09181234567' },
        { name: 'Angela Cruz', email: 'angela@ams.com', phone: '09191234567' },
        { name: 'Rico Santos', email: 'rico@ams.com', phone: '09201234567' },
        { name: 'Jenny Cruz', email: 'jenny@ams.com', phone: '09211234567' }
    ];

    const createdStaff = [];
    for (const staff of staffMembers) {
        const exists = await Staff.findOne({ email: staff.email });
        if (!exists) {
            const created = await Staff.create({
                ...staff,
                availability: {
                    monday: { start: '09:00', end: '18:00', isAvailable: true },
                    tuesday: { start: '09:00', end: '18:00', isAvailable: true },
                    wednesday: { start: '09:00', end: '18:00', isAvailable: true },
                    thursday: { start: '09:00', end: '18:00', isAvailable: true },
                    friday: { start: '09:00', end: '18:00', isAvailable: true },
                    saturday: { start: '10:00', end: '17:00', isAvailable: true },
                    sunday: { start: '00:00', end: '00:00', isAvailable: false }
                }
            });
            createdStaff.push(created);
            console.log(`✓ Staff created: ${staff.name}`);
        }
    }

    // Assign staff to services
    const allServices = await Service.find();
    const allStaff = await Staff.find();
    
    for (const service of allServices) {
        if (service.assignedStaff.length === 0) {
            const randomStaff = allStaff.slice(0, Math.floor(Math.random() * 3) + 1);
            service.assignedStaff = randomStaff.map(s => s._id);
            await service.save();
        }
    }

    // Create sample rewards
    const rewards = [
        { name: '10% Off Any Service', description: 'Get 10% discount on any service', pointsRequired: 100, type: 'discount', discountValue: 10, discountType: 'percentage' },
        { name: '₱50 Off', description: 'Get ₱50 off your next appointment', pointsRequired: 50, type: 'discount', discountValue: 50, discountType: 'fixed' },
        { name: 'Free Shaving', description: 'Redeem a free shaving service', pointsRequired: 150, type: 'free_service' },
        { name: '25% Off Hair Services', description: 'Get 25% off any hair service', pointsRequired: 250, type: 'discount', discountValue: 25, discountType: 'percentage' }
    ];

    for (const reward of rewards) {
        const exists = await Reward.findOne({ name: reward.name });
        if (!exists) {
            await Reward.create(reward);
            console.log(`✓ Reward created: ${reward.name}`);
        }
    }

    // Create test customer account
    const existingCustomer = await Customer.findOne({ email: 'customer@test.com' });
    if (!existingCustomer) {
        await Customer.create({
            name: 'Test Customer',
            email: 'customer@test.com',
            password: 'password123',
            isVerified: true,
            rewardPoints: 100
        });
        console.log('✓ Test customer created (email: customer@test.com, password: password123)');
    }

    console.log('\n✅ Seed completed!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Customer Login:');
    console.log('   Email: customer@test.com');
    console.log('   Password: password123');
    console.log('   URL: http://localhost:3000/login');
    console.log('\n🔐 Admin Login:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   URL: http://localhost:3000/admin/login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
});

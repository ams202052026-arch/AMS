const mongoose = require('mongoose');
require('dotenv').config();

const Appointment = require('../models/appointment');
const User = require('../models/user');
const Business = require('../models/business');
const { Reward } = require('../models/reward');

async function testDashboardData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected to MongoDB');

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(today.getDate() - today.getDay());

        // Test all queries
        console.log('\n📊 Testing Dashboard Queries...\n');

        const totalUsers = await User.countDocuments({ role: 'customer', isBanned: false });
        console.log(`✓ Total Users: ${totalUsers}`);

        const totalBusinesses = await Business.countDocuments();
        console.log(`✓ Total Businesses: ${totalBusinesses}`);

        const pendingBusinessApplications = await Business.countDocuments({ verificationStatus: 'pending' });
        console.log(`✓ Pending Applications: ${pendingBusinessApplications}`);

        const totalAppointments = await Appointment.countDocuments();
        console.log(`✓ Total Appointments: ${totalAppointments}`);

        const totalRevenueData = await Appointment.aggregate([
            { $match: { status: 'completed' } },
            { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 'serviceData' } },
            { $unwind: '$serviceData' },
            { $group: { _id: null, total: { $sum: { $ifNull: ['$finalPrice', '$serviceData.price'] } } } }
        ]);
        const totalRevenue = totalRevenueData[0]?.total || 0;
        console.log(`✓ Total Revenue: ₱${totalRevenue.toLocaleString()}`);

        const activeRewards = await Reward.countDocuments({ isActive: true });
        console.log(`✓ Active Rewards: ${activeRewards}`);

        const pendingVerifications = await Business.find({ verificationStatus: 'pending' })
            .populate('ownerId')
            .sort({ createdAt: -1 })
            .limit(5);
        console.log(`✓ Pending Verifications (top 5): ${pendingVerifications.length}`);

        const recentlyApproved = await Business.find({ verificationStatus: 'approved' })
            .populate('ownerId')
            .sort({ updatedAt: -1 })
            .limit(5);
        console.log(`✓ Recently Approved (top 5): ${recentlyApproved.length}`);

        const suspendedRejected = await Business.countDocuments({ 
            verificationStatus: { $in: ['suspended', 'rejected'] } 
        });
        console.log(`✓ Suspended/Rejected: ${suspendedRejected}`);

        const newUsersThisWeek = await User.countDocuments({
            role: 'customer',
            createdAt: { $gte: firstDayOfWeek }
        });
        console.log(`✓ New Users This Week: ${newUsersThisWeek}`);

        const newUsersThisMonth = await User.countDocuments({
            role: 'customer',
            createdAt: { $gte: firstDayOfMonth }
        });
        console.log(`✓ New Users This Month: ${newUsersThisMonth}`);

        const bannedUsers = await User.countDocuments({ isBanned: true });
        console.log(`✓ Banned Users: ${bannedUsers}`);

        const activeUsers = await User.countDocuments({ role: 'customer', isBanned: false });
        console.log(`✓ Active Users: ${activeUsers}`);

        // Test growth data
        console.log('\n📈 Testing Growth Data...\n');
        
        const businessGrowth = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
            const count = await Business.countDocuments({
                createdAt: { $gte: monthStart, $lt: monthEnd }
            });
            businessGrowth.push({
                month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                count
            });
        }
        console.log('✓ Business Growth (6 months):', businessGrowth);

        const userGrowth = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
            const count = await User.countDocuments({
                role: 'customer',
                createdAt: { $gte: monthStart, $lt: monthEnd }
            });
            userGrowth.push({
                month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                count
            });
        }
        console.log('✓ User Growth (6 months):', userGrowth);

        // Test top businesses
        const topBusinesses = await Appointment.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: '$businessId', totalAppointments: { $sum: 1 } } },
            { $sort: { totalAppointments: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'businesses',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'businessData'
                }
            },
            { $unwind: '$businessData' },
            {
                $lookup: {
                    from: 'services',
                    localField: '_id',
                    foreignField: 'businessId',
                    as: 'services'
                }
            },
            {
                $project: {
                    businessName: '$businessData.businessName',
                    totalAppointments: 1,
                    totalRevenue: {
                        $sum: '$services.price'
                    }
                }
            }
        ]);
        console.log(`✓ Top Businesses: ${topBusinesses.length}`);

        // Test revenue by month
        const revenueByMonth = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
            
            const monthRevenueData = await Appointment.aggregate([
                { $match: { status: 'completed', date: { $gte: monthStart, $lt: monthEnd } } },
                { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 'serviceData' } },
                { $unwind: '$serviceData' },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$finalPrice', '$serviceData.price'] } } } }
            ]);
            
            revenueByMonth.push({
                month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
                revenue: monthRevenueData[0]?.total || 0
            });
        }
        console.log('✓ Revenue by Month (6 months):', revenueByMonth);

        console.log('\n✅ All dashboard queries executed successfully!');
        console.log('\n🎉 Admin dashboard is ready to use!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
}

testDashboardData();

const Appointment = require('../../models/appointment');
const User = require('../../models/user');
const Staff = require('../../models/staff');
const Service = require('../../models/service');
const Business = require('../../models/business');
const { Reward } = require('../../models/reward');

// Load admin dashboard
exports.loadDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get first day of current month and week
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(today.getDate() - today.getDay());

        // 1. KEY METRICS (exclude super_admin from user counts)
        const totalUsers = await User.countDocuments({ role: 'customer', isBanned: false });
        const totalBusinesses = await Business.countDocuments();
        const pendingBusinessApplications = await Business.countDocuments({ verificationStatus: 'pending' });
        const totalAppointments = await Appointment.countDocuments();
        
        // Total Revenue (System-wide)
        const totalRevenueData = await Appointment.aggregate([
            { $match: { status: 'completed' } },
            { $lookup: { from: 'services', localField: 'service', foreignField: '_id', as: 'serviceData' } },
            { $unwind: '$serviceData' },
            { $group: { _id: null, total: { $sum: { $ifNull: ['$finalPrice', '$serviceData.price'] } } } }
        ]);
        const totalRevenue = totalRevenueData[0]?.total || 0;
        
        const activeRewards = await Reward.countDocuments({ isActive: true });

        // 2. BUSINESS OVERVIEW
        const pendingVerifications = await Business.find({ verificationStatus: 'pending' })
            .populate('ownerId')
            .sort({ createdAt: -1 })
            .limit(5);
            
        const recentlyApproved = await Business.find({ verificationStatus: 'approved' })
            .populate('ownerId')
            .sort({ updatedAt: -1 })
            .limit(5);
            
        const suspendedRejected = await Business.countDocuments({ 
            verificationStatus: { $in: ['suspended', 'rejected'] } 
        });

        // Business Growth (last 6 months)
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

        // 3. USER MANAGEMENT STATS
        const newUsersThisWeek = await User.countDocuments({
            role: 'customer',
            createdAt: { $gte: firstDayOfWeek }
        });
        
        const newUsersThisMonth = await User.countDocuments({
            role: 'customer',
            createdAt: { $gte: firstDayOfMonth }
        });
        
        const bannedUsers = await User.countDocuments({ role: 'customer', isBanned: true });
        const activeUsers = await User.countDocuments({ role: 'customer', isBanned: false });

        // User Growth (last 6 months)
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

        // 4. TOP PERFORMING BUSINESSES
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

        // 5. MONTHLY REVENUE TREND (last 6 months)
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

        res.render('admin/dashboard', {
            stats: {
                totalUsers,
                totalBusinesses,
                pendingBusinessApplications,
                totalAppointments,
                totalRevenue,
                activeRewards,
                suspendedRejected,
                newUsersThisWeek,
                newUsersThisMonth,
                bannedUsers,
                activeUsers
            },
            pendingVerifications,
            recentlyApproved,
            businessGrowth,
            userGrowth,
            topBusinesses,
            revenueByMonth
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).render('error', { 
            message: 'Error loading dashboard',
            title: 'Dashboard Error'
        });
    }
};

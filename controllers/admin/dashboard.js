const Appointment = require('../../models/appointment');
const User = require('../../models/user');
const Staff = require('../../models/staff');
const Service = require('../../models/service');
const Business = require('../../models/business');

// Load admin dashboard
exports.loadDashboard = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get first day of current month
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        // Basic stats
        const todayAppointments = await Appointment.countDocuments({
            date: { $gte: today, $lt: tomorrow }
        });

        const pendingAppointments = await Appointment.countDocuments({
            status: 'pending'
        });

        const totalCustomers = await User.countDocuments({ role: 'customer' });
        const activeStaff = await Staff.countDocuments({ isActive: true });

        // Business statistics
        const totalBusinesses = await Business.countDocuments();
        const pendingBusinesses = await Business.countDocuments({ verificationStatus: 'pending' });
        const approvedBusinesses = await Business.countDocuments({ verificationStatus: 'approved' });

        // Revenue statistics
        const todayRevenue = await Appointment.aggregate([
            {
                $match: {
                    date: { $gte: today, $lt: tomorrow },
                    status: 'completed'
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'service',
                    foreignField: '_id',
                    as: 'serviceData'
                }
            },
            {
                $unwind: '$serviceData'
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: {
                            $ifNull: ['$finalPrice', '$serviceData.price']
                        }
                    }
                }
            }
        ]);

        const monthRevenue = await Appointment.aggregate([
            {
                $match: {
                    date: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth },
                    status: 'completed'
                }
            },
            {
                $lookup: {
                    from: 'services',
                    localField: 'service',
                    foreignField: '_id',
                    as: 'serviceData'
                }
            },
            {
                $unwind: '$serviceData'
            },
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: {
                            $ifNull: ['$finalPrice', '$serviceData.price']
                        }
                    }
                }
            }
        ]);

        // Completion rate
        const totalAppointments = await Appointment.countDocuments({
            date: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth }
        });

        const completedAppointments = await Appointment.countDocuments({
            date: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth },
            status: 'completed'
        });

        const cancelledAppointments = await Appointment.countDocuments({
            date: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth },
            status: 'cancelled'
        });

        const completionRate = totalAppointments > 0 
            ? Math.round((completedAppointments / totalAppointments) * 100) 
            : 0;

        const cancellationRate = totalAppointments > 0 
            ? Math.round((cancelledAppointments / totalAppointments) * 100) 
            : 0;

        // Popular services (top 5)
        const popularServices = await Appointment.aggregate([
            {
                $match: {
                    date: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth }
                }
            },
            {
                $group: {
                    _id: '$service',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: 'services',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'serviceData'
                }
            },
            {
                $unwind: '$serviceData'
            },
            {
                $project: {
                    name: '$serviceData.name',
                    count: 1,
                    revenue: {
                        $multiply: ['$count', '$serviceData.price']
                    }
                }
            }
        ]);

        // Recent appointments
        const recentAppointments = await Appointment.find()
            .populate('customer')
            .populate('service')
            .populate('staff')
            .sort({ createdAt: -1 })
            .limit(10);

        // Pending appointments for quick actions
        const pendingAppointmentsList = await Appointment.find({ status: 'pending' })
            .populate('customer')
            .populate('service')
            .populate('staff')
            .sort({ date: 1 })
            .limit(5);

        // Staff performance (top 5)
        const staffPerformance = await Staff.find({ isActive: true })
            .sort({ appointmentsCompleted: -1 })
            .limit(5);

        // Chart data - Appointments trend (last 7 days)
        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const count = await Appointment.countDocuments({
                date: { $gte: date, $lt: nextDate }
            });

            chartData.push({
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                count: count
            });
        }

        res.render('admin/dashboard', {
            stats: {
                todayAppointments,
                pendingAppointments,
                totalCustomers,
                activeStaff,
                totalBusinesses,
                pendingBusinesses,
                approvedBusinesses,
                todayRevenue: todayRevenue[0]?.total || 0,
                monthRevenue: monthRevenue[0]?.total || 0,
                completionRate,
                cancellationRate,
                totalAppointments,
                completedAppointments,
                cancelledAppointments
            },
            recentAppointments,
            pendingAppointmentsList,
            staffPerformance,
            popularServices,
            chartData
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading dashboard' });
    }
};

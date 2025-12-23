const Appointment = require('../../models/appointment');
const Customer = require('../../models/customer');
const Staff = require('../../models/staff');
const Service = require('../../models/service');
const { Redemption } = require('../../models/reward');

// Load reports dashboard
exports.loadReports = async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        
        let startDate = new Date();
        let endDate = new Date();
        
        if (period === 'day') {
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        } else if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (period === 'year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
        }

        // Date filter - use both date and createdAt for compatibility
        const dateFilter = {
            $or: [
                { date: { $gte: startDate, $lte: endDate } },
                { createdAt: { $gte: startDate, $lte: endDate } }
            ]
        };

        // Appointment stats by date range
        const totalAppointments = await Appointment.countDocuments(dateFilter);

        const completedAppointments = await Appointment.countDocuments({
            ...dateFilter,
            status: 'completed'
        });

        const cancelledAppointments = await Appointment.countDocuments({
            ...dateFilter,
            status: 'cancelled'
        });

        const pendingAppointments = await Appointment.countDocuments({
            ...dateFilter,
            status: 'pending'
        });

        const approvedAppointments = await Appointment.countDocuments({
            ...dateFilter,
            status: 'approved'
        });

        // Revenue calculation
        const revenueData = await Appointment.aggregate([
            {
                $match: {
                    $or: [
                        { date: { $gte: startDate, $lte: endDate } },
                        { createdAt: { $gte: startDate, $lte: endDate } }
                    ],
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
                    totalRevenue: {
                        $sum: {
                            $ifNull: ['$finalPrice', '$serviceData.price']
                        }
                    },
                    averageRevenue: {
                        $avg: {
                            $ifNull: ['$finalPrice', '$serviceData.price']
                        }
                    }
                }
            }
        ]);

        // Service popularity with revenue
        const serviceStats = await Appointment.aggregate([
            { 
                $match: { 
                    $or: [
                        { date: { $gte: startDate, $lte: endDate } },
                        { createdAt: { $gte: startDate, $lte: endDate } }
                    ]
                } 
            },
            { 
                $group: { 
                    _id: '$service', 
                    count: { $sum: 1 },
                    completed: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                        }
                    }
                } 
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
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
                    service: '$serviceData',
                    count: 1,
                    completed: 1,
                    revenue: {
                        $multiply: ['$completed', '$serviceData.price']
                    }
                }
            }
        ]);

        // Staff performance with period-specific data
        // First get all staff
        const allStaff = await Staff.find({ isActive: true });
        
        // Then calculate stats for each staff
        const staffStats = await Promise.all(allStaff.map(async (staff) => {
            const totalAppointments = await Appointment.countDocuments({
                $or: [
                    { date: { $gte: startDate, $lte: endDate } },
                    { createdAt: { $gte: startDate, $lte: endDate } }
                ],
                staff: staff._id
            });

            const completedAppointments = await Appointment.countDocuments({
                $or: [
                    { date: { $gte: startDate, $lte: endDate } },
                    { createdAt: { $gte: startDate, $lte: endDate } }
                ],
                staff: staff._id,
                status: 'completed'
            });

            const completionRate = totalAppointments > 0 
                ? Math.round((completedAppointments / totalAppointments) * 100)
                : 0;

            return {
                staff: staff,
                totalAppointments,
                completedAppointments,
                completionRate
            };
        }));

        // Filter out staff with no appointments and sort by completed
        const staffPerformance = staffStats
            .filter(s => s.totalAppointments > 0)
            .sort((a, b) => b.completedAppointments - a.completedAppointments)
            .slice(0, 10);

        // Customer activity
        const newCustomers = await Customer.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate }
        });

        const totalCustomers = await Customer.countDocuments();

        // Loyalty stats
        const totalRedemptions = await Redemption.countDocuments({
            redeemedAt: { $gte: startDate, $lte: endDate }
        });

        const pointsData = await Redemption.aggregate([
            { $match: { redeemedAt: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, total: { $sum: '$pointsUsed' } } }
        ]);

        // Points awarded
        const pointsAwarded = await Appointment.aggregate([
            {
                $match: {
                    status: 'completed',
                    $or: [
                        { date: { $gte: startDate, $lte: endDate } },
                        { createdAt: { $gte: startDate, $lte: endDate } }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$pointsAwarded' }
                }
            }
        ]);

        // Customer retention (returning customers)
        const returningCustomers = await Appointment.aggregate([
            {
                $match: {
                    $or: [
                        { date: { $gte: startDate, $lte: endDate } },
                        { createdAt: { $gte: startDate, $lte: endDate } }
                    ]
                }
            },
            {
                $group: {
                    _id: '$customer',
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            },
            {
                $count: 'total'
            }
        ]);

        res.render('admin/reports', {
            period,
            stats: {
                totalAppointments,
                completedAppointments,
                cancelledAppointments,
                pendingAppointments,
                approvedAppointments,
                completionRate: totalAppointments > 0 
                    ? Math.round((completedAppointments / totalAppointments) * 100) 
                    : 0,
                cancellationRate: totalAppointments > 0 
                    ? Math.round((cancelledAppointments / totalAppointments) * 100) 
                    : 0,
                totalRevenue: revenueData[0]?.totalRevenue || 0,
                averageRevenue: revenueData[0]?.averageRevenue || 0,
                newCustomers,
                totalCustomers,
                returningCustomers: returningCustomers[0]?.total || 0,
                totalRedemptions,
                pointsRedeemed: pointsData[0]?.total || 0,
                pointsAwarded: pointsAwarded[0]?.total || 0
            },
            servicePopularity: serviceStats,
            staffPerformance: staffPerformance
        });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Error loading reports' });
    }
};

// Export report data to Excel
exports.exportReport = async (req, res) => {
    try {
        const ExcelJS = require('exceljs');
        const { type, period = 'week' } = req.query;
        
        let startDate = new Date();
        let endDate = new Date();
        
        if (period === 'day') {
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        } else if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (period === 'year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
        }

        const dateFilter = {
            $or: [
                { date: { $gte: startDate, $lte: endDate } },
                { createdAt: { $gte: startDate, $lte: endDate } }
            ]
        };

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'AMS Admin';
        workbook.created = new Date();

        if (type === 'appointments') {
            const appointments = await Appointment.find(dateFilter)
                .populate('customer')
                .populate('service')
                .populate('staff')
                .sort({ date: -1 });

            const worksheet = workbook.addWorksheet('Appointments');

            // Add header row with styling
            worksheet.columns = [
                { header: 'Queue Number', key: 'queueNumber', width: 20 },
                { header: 'Customer', key: 'customer', width: 25 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Service', key: 'service', width: 25 },
                { header: 'Staff', key: 'staff', width: 20 },
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Time', key: 'time', width: 20 },
                { header: 'Status', key: 'status', width: 15 },
                { header: 'Price', key: 'price', width: 12 },
                { header: 'Points Awarded', key: 'points', width: 15 }
            ];

            // Style header row
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF667EEA' }
            };
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

            // Add data rows
            appointments.forEach(apt => {
                worksheet.addRow({
                    queueNumber: apt.queueNumber,
                    customer: apt.customer ? apt.customer.name : 'N/A',
                    email: apt.customer ? apt.customer.email : 'N/A',
                    service: apt.service ? apt.service.name : 'N/A',
                    staff: apt.staff ? apt.staff.name : 'Unassigned',
                    date: apt.date ? new Date(apt.date).toLocaleDateString() : 'N/A',
                    time: apt.timeSlot ? `${apt.timeSlot.start} - ${apt.timeSlot.end}` : 'N/A',
                    status: apt.status,
                    price: apt.finalPrice || (apt.service ? apt.service.price : 0),
                    points: apt.pointsAwarded || 0
                });
            });

            // Add borders to all cells
            worksheet.eachRow((row, rowNumber) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });

        } else if (type === 'staff') {
            const staff = await Staff.find({ isActive: true });

            // Get appointment counts for each staff
            const staffWithStats = await Promise.all(staff.map(async (s) => {
                const appointments = await Appointment.countDocuments({
                    ...dateFilter,
                    staff: s._id
                });
                const completed = await Appointment.countDocuments({
                    ...dateFilter,
                    staff: s._id,
                    status: 'completed'
                });
                return {
                    ...s.toObject(),
                    periodAppointments: appointments,
                    periodCompleted: completed,
                    completionRate: appointments > 0 ? Math.round((completed / appointments) * 100) : 0
                };
            }));

            const worksheet = workbook.addWorksheet('Staff Performance');

            // Add header row with styling
            worksheet.columns = [
                { header: 'Staff Name', key: 'name', width: 25 },
                { header: 'Email', key: 'email', width: 30 },
                { header: 'Phone', key: 'phone', width: 20 },
                { header: 'Total Completed (All Time)', key: 'totalCompleted', width: 25 },
                { header: 'Period Appointments', key: 'periodAppointments', width: 20 },
                { header: 'Period Completed', key: 'periodCompleted', width: 20 },
                { header: 'Completion Rate', key: 'completionRate', width: 18 },
                { header: 'Specialties', key: 'specialties', width: 30 }
            ];

            // Style header row
            worksheet.getRow(1).font = { bold: true };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF667EEA' }
            };
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

            // Add data rows
            staffWithStats.forEach(s => {
                worksheet.addRow({
                    name: s.name,
                    email: s.email,
                    phone: s.phone || 'N/A',
                    totalCompleted: s.appointmentsCompleted,
                    periodAppointments: s.periodAppointments,
                    periodCompleted: s.periodCompleted,
                    completionRate: `${s.completionRate}%`,
                    specialties: s.specialties && s.specialties.length > 0 ? s.specialties.join(', ') : 'N/A'
                });
            });

            // Add borders to all cells
            worksheet.eachRow((row, rowNumber) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });
        }

        // Set response headers for Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=AMS_${type}_${period}_${Date.now()}.xlsx`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error exporting report' });
    }
};

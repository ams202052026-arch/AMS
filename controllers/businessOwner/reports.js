/**
 * Business Reports Controller
 * Generates various business reports with Excel export
 */

const Business = require('../../models/business');
const Appointment = require('../../models/appointment');
const Service = require('../../models/service');
const Staff = require('../../models/staff');
const ExcelJS = require('exceljs');

/**
 * Load Reports Page
 */
exports.loadReportsPage = async (req, res) => {
    try {
        const userId = req.session.userId;
        const business = await Business.findOne({ ownerId: userId });
        
        if (!business) {
            return res.redirect('/business/register');
        }

        res.render('businessOwner/reports', { business });
    } catch (error) {
        console.error('Error loading reports page:', error);
        res.status(500).render('error', { message: 'Error loading reports' });
    }
};

/**
 * Generate Staff Performance Report
 */
exports.generateStaffPerformanceReport = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { startDate, endDate } = req.query;
        
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        // Date range
        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const end = endDate ? new Date(endDate) : new Date();

        // Get staff performance data
        const staffPerformance = await Appointment.aggregate([
            {
                $match: {
                    businessId: business._id,
                    date: { $gte: start, $lte: end },
                    status: { $in: ['completed', 'confirmed', 'in-progress'] }
                }
            },
            {
                $group: {
                    _id: '$staff',
                    totalAppointments: { $sum: 1 },
                    completedAppointments: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'staff',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'staffData'
                }
            },
            {
                $unwind: '$staffData'
            },
            {
                $lookup: {
                    from: 'appointments',
                    let: { staffId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$staff', '$$staffId'] },
                                        { $eq: ['$status', 'completed'] },
                                        { $gte: ['$date', start] },
                                        { $lte: ['$date', end] }
                                    ]
                                }
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
                                    $sum: { $ifNull: ['$finalPrice', '$serviceData.price'] }
                                }
                            }
                        }
                    ],
                    as: 'revenueData'
                }
            },
            {
                $project: {
                    staffName: '$staffData.name',
                    totalAppointments: 1,
                    completedAppointments: 1,
                    completionRate: {
                        $multiply: [
                            { $divide: ['$completedAppointments', '$totalAppointments'] },
                            100
                        ]
                    },
                    totalRevenue: {
                        $ifNull: [{ $arrayElemAt: ['$revenueData.totalRevenue', 0] }, 0]
                    }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            }
        ]);

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Staff Performance');

        // Add header
        worksheet.columns = [
            { header: 'Staff Name', key: 'staffName', width: 25 },
            { header: 'Total Appointments', key: 'totalAppointments', width: 20 },
            { header: 'Completed', key: 'completedAppointments', width: 15 },
            { header: 'Completion Rate (%)', key: 'completionRate', width: 20 },
            { header: 'Total Revenue (₱)', key: 'totalRevenue', width: 20 }
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF667eea' }
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Add data
        staffPerformance.forEach(staff => {
            worksheet.addRow({
                staffName: staff.staffName,
                totalAppointments: staff.totalAppointments,
                completedAppointments: staff.completedAppointments,
                completionRate: staff.completionRate.toFixed(2),
                totalRevenue: staff.totalRevenue.toFixed(2)
            });
        });

        // Add summary
        worksheet.addRow([]);
        const summaryRow = worksheet.addRow([
            'TOTAL',
            staffPerformance.reduce((sum, s) => sum + s.totalAppointments, 0),
            staffPerformance.reduce((sum, s) => sum + s.completedAppointments, 0),
            '',
            staffPerformance.reduce((sum, s) => sum + s.totalRevenue, 0).toFixed(2)
        ]);
        summaryRow.font = { bold: true };

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=staff-performance-${Date.now()}.xlsx`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generating staff performance report:', error);
        res.status(500).json({ error: 'Error generating report' });
    }
};

/**
 * Generate Services Report
 */
exports.generateServicesReport = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { startDate, endDate } = req.query;
        
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const end = endDate ? new Date(endDate) : new Date();

        // Get services performance
        const servicesPerformance = await Appointment.aggregate([
            {
                $match: {
                    businessId: business._id,
                    date: { $gte: start, $lte: end },
                    status: { $in: ['completed', 'confirmed', 'in-progress'] }
                }
            },
            {
                $group: {
                    _id: '$service',
                    totalBookings: { $sum: 1 },
                    completedBookings: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    }
                }
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
                    serviceName: '$serviceData.name',
                    price: '$serviceData.price',
                    duration: '$serviceData.duration',
                    totalBookings: 1,
                    completedBookings: 1,
                    totalRevenue: { $multiply: ['$completedBookings', '$serviceData.price'] }
                }
            },
            {
                $sort: { totalBookings: -1 }
            }
        ]);

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Services Performance');

        worksheet.columns = [
            { header: 'Service Name', key: 'serviceName', width: 30 },
            { header: 'Price (₱)', key: 'price', width: 15 },
            { header: 'Duration (mins)', key: 'duration', width: 18 },
            { header: 'Total Bookings', key: 'totalBookings', width: 18 },
            { header: 'Completed', key: 'completedBookings', width: 15 },
            { header: 'Total Revenue (₱)', key: 'totalRevenue', width: 20 }
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF667eea' }
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        servicesPerformance.forEach(service => {
            worksheet.addRow({
                serviceName: service.serviceName,
                price: service.price,
                duration: service.duration,
                totalBookings: service.totalBookings,
                completedBookings: service.completedBookings,
                totalRevenue: service.totalRevenue.toFixed(2)
            });
        });

        worksheet.addRow([]);
        const summaryRow = worksheet.addRow([
            'TOTAL',
            '',
            '',
            servicesPerformance.reduce((sum, s) => sum + s.totalBookings, 0),
            servicesPerformance.reduce((sum, s) => sum + s.completedBookings, 0),
            servicesPerformance.reduce((sum, s) => sum + s.totalRevenue, 0).toFixed(2)
        ]);
        summaryRow.font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=services-report-${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generating services report:', error);
        res.status(500).json({ error: 'Error generating report' });
    }
};

/**
 * Generate Revenue Report
 */
exports.generateRevenueReport = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { startDate, endDate } = req.query;
        
        const business = await Business.findOne({ ownerId: userId });
        if (!business) {
            return res.status(404).json({ error: 'Business not found' });
        }

        const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
        const end = endDate ? new Date(endDate) : new Date();

        // Get daily revenue
        const dailyRevenue = await Appointment.aggregate([
            {
                $match: {
                    businessId: business._id,
                    date: { $gte: start, $lte: end },
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
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    totalAppointments: { $sum: 1 },
                    totalRevenue: {
                        $sum: { $ifNull: ['$finalPrice', '$serviceData.price'] }
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Revenue Report');

        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Appointments', key: 'appointments', width: 18 },
            { header: 'Revenue (₱)', key: 'revenue', width: 20 }
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF667eea' }
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        dailyRevenue.forEach(day => {
            worksheet.addRow({
                date: day._id,
                appointments: day.totalAppointments,
                revenue: day.totalRevenue.toFixed(2)
            });
        });

        worksheet.addRow([]);
        const summaryRow = worksheet.addRow([
            'TOTAL',
            dailyRevenue.reduce((sum, d) => sum + d.totalAppointments, 0),
            dailyRevenue.reduce((sum, d) => sum + d.totalRevenue, 0).toFixed(2)
        ]);
        summaryRow.font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=revenue-report-${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generating revenue report:', error);
        res.status(500).json({ error: 'Error generating report' });
    }
};

module.exports = exports;

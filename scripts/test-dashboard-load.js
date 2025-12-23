const mongoose = require('mongoose');
const Business = require('../models/business');
const User = require('../models/user');
const Service = require('../models/service');
const Appointment = require('../models/appointment');
const Staff = require('../models/staff');
require('dotenv').config();

async function testDashboardLoad() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        const user = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        const business = await Business.findOne({ ownerId: user._id });
        
        console.log('=== Dashboard Data Check ===\n');
        console.log('Business:', business.businessName);
        console.log('Business ID:', business._id);
        
        // Check services
        const totalServices = await Service.countDocuments({ 
            businessId: business._id,
            isActive: true 
        });
        console.log('\n✓ Services:', totalServices);
        
        // Check staff
        const totalStaff = await Staff.countDocuments({
            businessId: business._id,
            isActive: true
        });
        console.log('✓ Staff:', totalStaff);
        
        // Check appointments
        const totalAppointments = await Appointment.countDocuments({
            businessId: business._id
        });
        console.log('✓ Appointments:', totalAppointments);
        
        // Test staff performance aggregation
        console.log('\n=== Staff Performance Aggregation ===\n');
        const staffPerformance = await Appointment.aggregate([
            {
                $match: {
                    businessId: business._id,
                    status: { $in: ['completed', 'confirmed', 'in-progress', 'pending'] }
                }
            },
            {
                $group: {
                    _id: '$staff',
                    totalAppointments: { $sum: 1 },
                    completedAppointments: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    pendingAppointments: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    }
                }
            },
            {
                $lookup: {
                    from: 'staffs',
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
                                        { $eq: ['$status', 'completed'] }
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
                    staffId: '$_id',
                    staffName: '$staffData.name',
                    totalAppointments: 1,
                    completedAppointments: 1,
                    pendingAppointments: 1,
                    completionRate: {
                        $cond: [
                            { $gt: ['$totalAppointments', 0] },
                            {
                                $multiply: [
                                    { $divide: ['$completedAppointments', '$totalAppointments'] },
                                    100
                                ]
                            },
                            0
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
        
        console.log('Staff Performance Results:', staffPerformance.length, 'staff members');
        staffPerformance.forEach((staff, index) => {
            console.log(`\n${index + 1}. ${staff.staffName}`);
            console.log(`   Total Appointments: ${staff.totalAppointments}`);
            console.log(`   Completed: ${staff.completedAppointments}`);
            console.log(`   Pending: ${staff.pendingAppointments}`);
            console.log(`   Completion Rate: ${staff.completionRate.toFixed(1)}%`);
            console.log(`   Total Revenue: ₱${staff.totalRevenue.toLocaleString()}`);
        });
        
        console.log('\n✅ Dashboard should now display staff performance data!');
        console.log('\nNext: Visit http://localhost:3000/business-owner/dashboard');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testDashboardLoad();

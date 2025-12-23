const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const Business = require('../models/business');
const User = require('../models/user');
require('dotenv').config();

async function testFullAggregation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        const user = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        const business = await Business.findOne({ ownerId: user._id });
        
        console.log('Business ID:', business._id);
        console.log('\n=== Testing Full Staff Performance Aggregation ===\n');
        
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
        
        console.log('Staff Performance Result:');
        console.log(JSON.stringify(staffPerformance, null, 2));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testFullAggregation();

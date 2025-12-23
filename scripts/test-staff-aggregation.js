const mongoose = require('mongoose');
const Appointment = require('../models/appointment');
const Business = require('../models/business');
const User = require('../models/user');
require('dotenv').config();

async function testAggregation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        const user = await User.findOne({ email: 'alphi.fidelino@lspu.edu.ph' });
        const business = await Business.findOne({ ownerId: user._id });
        
        console.log('Business ID:', business._id);
        console.log('Business Name:', business.businessName);
        console.log('\n=== Testing Staff Performance Aggregation ===\n');
        
        // Test simple aggregation first
        console.log('Step 1: Group by staff...');
        const step1 = await Appointment.aggregate([
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
                    }
                }
            }
        ]);
        console.log('Result:', JSON.stringify(step1, null, 2));
        
        // Test with lookup
        console.log('\nStep 2: Add staff lookup...');
        const step2 = await Appointment.aggregate([
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
            }
        ]);
        console.log('Result:', JSON.stringify(step2, null, 2));
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

testAggregation();

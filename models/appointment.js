const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    // Business Reference (NEW)
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    },
    date: {
        type: Date,
        required: true
    },
    timeSlot: {
        start: { type: String, required: true },
        end: { type: String, required: true }
    },
    queueNumber: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled', 'no-show'],
        default: 'pending'
    },
    isWalkIn: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String
    },
    rescheduleRequest: {
        requested: { type: Boolean, default: false },
        newDate: Date,
        newTimeSlot: {
            start: String,
            end: String
        },
        reason: String
    },
    completedAt: {
        type: Date
    },
    pointsAwarded: {
        type: Number,
        default: 0
    },
    appliedRedemption: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Redemption'
    },
    discountApplied: {
        type: Number,
        default: 0
    },
    finalPrice: {
        type: Number
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Generate queue number before saving
appointmentSchema.pre('save', async function(next) {
    if (this.isNew && !this.queueNumber) {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        
        // Create separate date objects for the query
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        const count = await mongoose.model('Appointment').countDocuments({
            createdAt: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        });
        
        this.queueNumber = `Q${dateStr}-${String(count + 1).padStart(3, '0')}`;
        console.log('Generated queue number:', this.queueNumber);
    }
    next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);

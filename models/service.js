const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    // Business Reference (NEW)
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    details: [{
        type: String
    }],
    price: {
        type: Number,
        required: true
    },
    duration: {
        type: Number, // in minutes
        required: true
    },
    image: {
        type: String,
        default: '/image/default-service.jpg'
    },
    category: {
        type: String,
        enum: ['hair', 'skin', 'nails', 'spa', 'other'],
        default: 'other'
    },
    assignedStaff: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    pointsEarned: {
        type: Number,
        default: 10
    },
    minAdvanceBooking: {
        value: {
            type: Number,
            default: 0
        },
        unit: {
            type: String,
            enum: ['minutes', 'hours', 'days'],
            default: 'hours'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Service', serviceSchema);

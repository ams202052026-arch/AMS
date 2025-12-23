const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    pointsRequired: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['discount'],
        default: 'discount'
    },
    discountValue: {
        type: Number // percentage or fixed amount
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed'],
        default: 'percentage'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Customer reward redemption tracking
const redemptionSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reward: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reward',
        required: true
    },
    pointsUsed: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'used', 'expired'],
        default: 'active'
    },
    appliedToAppointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    usedAt: {
        type: Date
    },
    redeemedAt: {
        type: Date,
        default: Date.now
    }
});

const Reward = mongoose.model('Reward', rewardSchema);
const Redemption = mongoose.model('Redemption', redemptionSchema);

module.exports = { Reward, Redemption };

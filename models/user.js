const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Basic Information
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    
    // Role-based Access
    role: {
        type: String,
        enum: ['super_admin', 'business_owner', 'customer'],
        default: 'customer',
        required: true
    },
    
    // Profile
    profilePicture: {
        type: String,
        default: '/images/default-avatar.jpg'
    },
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    
    // Email Verification
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: String,
    verificationTokenExpires: Date,
    
    // Password Reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    
    // For Business Owners
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business'
    },
    
    // For Customers
    rewardPoints: {
        type: Number,
        default: 0
    },
    appointmentHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    }],
    favoriteBusinesses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business'
    }],
    
    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    banReason: String,
    
    // Activity Tracking
    lastLogin: Date,
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Method to check if account is locked
userSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    
    // Otherwise increment
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock the account after 5 failed attempts for 2 hours
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours
    
    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
        updates.$set = { lockUntil: Date.now() + lockTime };
    }
    
    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 }
    });
};

// Method to check if user is business owner
userSchema.methods.isBusinessOwner = function() {
    return this.role === 'business_owner';
};

// Method to check if user is super admin
userSchema.methods.isSuperAdmin = function() {
    return this.role === 'super_admin';
};

// Method to check if user is customer
userSchema.methods.isCustomer = function() {
    return this.role === 'customer';
};

module.exports = mongoose.model('User', userSchema);

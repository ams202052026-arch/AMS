const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    // Owner Reference
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Business Information
    businessName: {
        type: String,
        required: true,
        trim: true
    },
    businessType: {
        type: String,
        enum: ['salon', 'spa', 'clinic', 'barbershop', 'gym', 'wellness', 'beauty', 'other'],
        default: 'other'
    },
    description: {
        type: String,
        trim: true
    },
    logo: {
        type: String,
        default: '/images/default-business-logo.jpg'
    },
    coverPhoto: {
        type: String,
        default: '/images/default-business-cover.jpg'
    },
    
    // Contact Information
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    website: {
        type: String,
        trim: true
    },
    
    // Address
    address: {
        street: { type: String, required: true },
        barangay: { type: String, required: true },
        city: { type: String, required: true },
        province: { type: String, required: true },
        zipCode: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    
    // Business Hours
    businessHours: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        isOpen: {
            type: Boolean,
            default: true
        },
        openTime: String,  // Format: "09:00"
        closeTime: String  // Format: "18:00"
    }],
    
    // Verification
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },
    verificationDocuments: [{
        type: {
            type: String,
            enum: ['dti', 'business_permit', 'valid_id', 'bir', 'mayor_permit', 'other']
        },
        fileUrl: String,
        fileName: String,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    rejectionReason: String,
    verifiedAt: Date,
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // Statistics
    totalServices: {
        type: Number,
        default: 0
    },
    totalBookings: {
        type: Number,
        default: 0
    },
    completedBookings: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    
    // Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Business Operations Status
    isCurrentlyOpen: {
        type: Boolean,
        default: true
    },
    temporaryClosureReason: {
        type: String,
        trim: true
    },
    temporaryClosureUntil: {
        type: Date
    },
    
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
businessSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for full address
businessSchema.virtual('fullAddress').get(function() {
    if (!this.address) return '';
    return `${this.address.street}, ${this.address.barangay}, ${this.address.city}, ${this.address.province}`;
});

// Method to check if business is verified
businessSchema.methods.isVerified = function() {
    return this.verificationStatus === 'approved';
};

// Method to check if business can accept bookings
businessSchema.methods.canAcceptBookings = function() {
    return this.isActive && this.verificationStatus === 'approved' && this.isCurrentlyOpen;
};

// Method to check if business is open on a specific day and time
businessSchema.methods.isOpenAt = function(date, time) {
    if (!this.isCurrentlyOpen || !this.isActive) return false;
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const businessHour = this.businessHours.find(bh => bh.day === dayName);
    
    if (!businessHour || !businessHour.isOpen) return false;
    
    // Convert time strings to minutes for comparison
    const timeToMinutes = (timeStr) => {
        const [hours, mins] = timeStr.split(':').map(Number);
        return hours * 60 + mins;
    };
    
    const currentMinutes = timeToMinutes(time);
    const openMinutes = timeToMinutes(businessHour.openTime);
    const closeMinutes = timeToMinutes(businessHour.closeTime);
    
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
};

// Method to get business hours for a specific day
businessSchema.methods.getHoursForDay = function(dayName) {
    return this.businessHours.find(bh => bh.day === dayName);
};

// Method to check if business is temporarily closed
businessSchema.methods.isTemporarilyClosed = function() {
    if (!this.temporaryClosureUntil) return false;
    return new Date() < this.temporaryClosureUntil;
};

module.exports = mongoose.model('Business', businessSchema);

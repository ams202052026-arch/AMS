const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    // Singleton pattern - only one document should exist
    _id: {
        type: String,
        default: 'system_settings'
    },
    
    // Loyalty Points Settings
    maxPointsPerService: {
        type: Number,
        default: 100,
        min: 1,
        max: 1000
    },
    
    minPointsPerService: {
        type: Number,
        default: 1,
        min: 0,
        max: 100
    },
    
    // Other system-wide settings can be added here
    maintenanceMode: {
        type: Boolean,
        default: false
    },
    
    maintenanceMessage: {
        type: String,
        default: 'System is under maintenance. Please check back later.'
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Update timestamp on save
systemSettingsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get settings (creates default if doesn't exist)
systemSettingsSchema.statics.getSettings = async function() {
    let settings = await this.findById('system_settings');
    
    if (!settings) {
        settings = await this.create({
            _id: 'system_settings',
            maxPointsPerService: 100,
            minPointsPerService: 1,
            maintenanceMode: false
        });
    }
    
    return settings;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);

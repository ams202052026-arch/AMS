// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },

  title: { 
    type: String, 
    required: true 
  },

  message: { 
    type: String, 
    required: true 
  },

  type: { 
    type: String, 
    enum: [
      'appointment_confirm',      // Booking confirmed & Approved
      'appointment_update',       // Appointment rescheduled
      'appointment_cancelled',    // Admin/customer cancelled
      'appointment_reminder',     // 24-hour reminder
      'queue_update',            // Ready to serve
      'reward_update',           // Service completed (with points)
      'reward_redeemed',         // Reward redeemed
      'reward_milestone',        // Points milestone reached
      'business_approved',       // Business application approved
      'business_rejected',       // Business application rejected
      'business_suspended',      // Business suspended
      'business_reactivated'     // Business reactivated
    ],
    required: true
  },

  read: {
    type: Boolean,
    default: false
  },

  meta: {
    type: Object // additional data (optional)
  }

}, { timestamps: true });

notificationSchema.index({ customer: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 } // auto-delete after 60 seconds
});

module.exports = mongoose.model('OTP', otpSchema);

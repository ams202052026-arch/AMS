const Admin = require('../../models/admin');
const OTP = require('../../models/otp');
const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS
    }
});

// Load forgot password page
exports.loadForgotPasswordPage = (req, res) => {
    res.render('admin/forgotPassword');
};

// Send OTP to admin email
exports.sendResetOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if admin exists
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ 
                success: false, 
                message: 'No admin account found with this email address' 
            });
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to database
        await OTP.create({
            email,
            code: otpCode
        });

        // Send OTP email
        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: 'AMS Admin - Password Reset OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #667eea;">Password Reset Request</h2>
                    <p>Hello Admin,</p>
                    <p>You have requested to reset your password. Please use the following OTP code:</p>
                    <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                        <h1 style="color: #667eea; margin: 0; font-size: 36px; letter-spacing: 5px;">${otpCode}</h1>
                    </div>
                    <p>This code will expire in <strong>10 minutes</strong>.</p>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">AMS - Appointment Management System</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ 
            success: true, 
            message: 'OTP sent to your email address' 
        });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error sending OTP. Please try again.' 
        });
    }
};

// Load verify OTP page
exports.loadVerifyOTPPage = (req, res) => {
    const { email } = req.query;
    res.render('admin/verifyResetOTP', { email });
};

// Verify OTP
exports.verifyResetOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Find valid OTP
        const otpRecord = await OTP.findOne({
            email,
            code: otp
        });

        if (!otpRecord) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or expired OTP' 
            });
        }

        // Delete used OTP
        await OTP.deleteOne({ _id: otpRecord._id });

        res.json({ 
            success: true, 
            message: 'OTP verified successfully' 
        });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error verifying OTP' 
        });
    }
};

// Load reset password page
exports.loadResetPasswordPage = (req, res) => {
    const { email } = req.query;
    res.render('admin/resetPassword', { email });
};

// Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword, confirmPassword } = req.body;

        // Validate passwords
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Passwords do not match' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters long' 
            });
        }

        // Update admin password
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin not found' 
            });
        }

        admin.password = newPassword;
        await admin.save();

        res.json({ 
            success: true, 
            message: 'Password reset successfully' 
        });

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error resetting password' 
        });
    }
};

const User = require('../models/user');
const OTPModel = require('../models/otp');
const nodemailer = require('nodemailer');

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASS
    }
});

// Generate 5-digit OTP
function generateOTP() {
    let code = "";
    for (let i = 0; i < 5; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
}

// Step 1: Load forgot password page
exports.loadForgotPasswordPage = (req, res) => {
    res.render('forgotPassword', { error: null, success: null });
};

// Step 2: Send OTP to email
exports.sendResetOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.render('forgotPassword', { 
                error: 'Email not found. Please check and try again.',
                success: null 
            });
        }

        // Generate OTP
        const code = generateOTP();

        // Delete any existing OTP for this email
        await OTPModel.deleteMany({ email: email.toLowerCase() });

        // Save new OTP (expires after 60 seconds)
        await OTPModel.create({
            email: email.toLowerCase(),
            code
        });

        // Send email
        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: email,
            subject: 'Password Reset OTP - AMS',
            html: `
                <h2>Password Reset Request</h2>
                <p>Your OTP code is:</p>
                <h1 style="color: #667eea; font-size: 32px;">${code}</h1>
                <p>This code will expire in 1 minute.</p>
                <p>If you didn't request this, please ignore this email.</p>
            `
        });

        console.log(`✅ Reset OTP sent to: ${email}`);

        // Store email in session for verification
        req.session.resetEmail = email.toLowerCase();

        res.redirect('/forgot-password/verify-otp');
    } catch (error) {
        console.error('❌ Error sending OTP:', error);
        res.render('forgotPassword', { 
            error: 'Error sending OTP. Please try again.',
            success: null 
        });
    }
};

// Step 3: Load OTP verification page
exports.loadVerifyOTPPage = (req, res) => {
    if (!req.session.resetEmail) {
        return res.redirect('/forgot-password');
    }
    res.render('verifyResetOTP', { error: null });
};

// Step 4: Verify OTP
exports.verifyResetOTP = async (req, res) => {
    try {
        const { code } = req.body;
        const email = req.session.resetEmail;

        if (!email) {
            return res.redirect('/forgot-password');
        }

        // Find OTP record
        const otpRecord = await OTPModel.findOne({ email });

        if (!otpRecord) {
            return res.render('verifyResetOTP', { 
                error: 'OTP expired. Please request a new one.' 
            });
        }

        // Check if expired (60 seconds)
        if (Date.now() - otpRecord.createdAt.getTime() > 60000) {
            await OTPModel.deleteOne({ email });
            return res.render('verifyResetOTP', { 
                error: 'OTP expired. Please request a new one.' 
            });
        }

        // Check if code matches
        if (otpRecord.code !== code) {
            return res.render('verifyResetOTP', { 
                error: 'Invalid OTP. Please try again.' 
            });
        }

        // OTP verified - delete it and proceed to reset password
        await OTPModel.deleteOne({ email });
        
        console.log(`✅ OTP verified for: ${email}`);
        
        // Store verification flag in session
        req.session.otpVerified = true;
        
        res.redirect('/forgot-password/reset');
    } catch (error) {
        console.error('❌ Error verifying OTP:', error);
        res.render('verifyResetOTP', { 
            error: 'Error verifying OTP. Please try again.' 
        });
    }
};

// Step 5: Load reset password page
exports.loadResetPasswordPage = (req, res) => {
    if (!req.session.resetEmail || !req.session.otpVerified) {
        return res.redirect('/forgot-password');
    }
    res.render('resetPassword', { error: null });
};

// Step 6: Reset password
exports.resetPassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;
        const email = req.session.resetEmail;

        if (!email || !req.session.otpVerified) {
            return res.redirect('/forgot-password');
        }

        // Validate passwords
        if (!newPassword || !confirmPassword) {
            return res.render('resetPassword', { 
                error: 'Please fill in all fields' 
            });
        }

        if (newPassword !== confirmPassword) {
            return res.render('resetPassword', { 
                error: 'Passwords do not match' 
            });
        }

        if (newPassword.length < 6) {
            return res.render('resetPassword', { 
                error: 'Password must be at least 6 characters' 
            });
        }

        // Update password (plain text to match existing system)
        await User.findOneAndUpdate(
            { email },
            { password: newPassword }
        );

        console.log(`✅ Password reset successful for: ${email}`);

        // Clear session
        delete req.session.resetEmail;
        delete req.session.otpVerified;

        // Redirect to login with success message
        res.redirect('/login?reset=success');
    } catch (error) {
        console.error('❌ Error resetting password:', error);
        res.render('resetPassword', { 
            error: 'Error resetting password. Please try again.' 
        });
    }
};

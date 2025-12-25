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
            subject: 'Password Reset Code - AMS',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; padding: 40px 20px;">
                    <tr>
                      <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08); overflow: hidden;">
                          
                          <!-- Header -->
                          <tr>
                            <td style="background: #1a1a1a; padding: 40px 40px 30px; text-align: center;">
                              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="32" cy="32" r="30" stroke="#ffffff" stroke-width="2" fill="none"/>
                                <path d="M32 18C26.4772 18 22 22.4772 22 28V30C20.8954 30 20 30.8954 20 32V44C20 45.1046 20.8954 46 22 46H42C43.1046 46 44 45.1046 44 44V32C44 30.8954 43.1046 30 42 30V28C42 22.4772 37.5228 18 32 18ZM32 20C36.4183 20 40 23.5817 40 28V30H24V28C24 23.5817 27.5817 20 32 20ZM32 34C33.1046 34 34 34.8954 34 36C34 36.7403 33.5978 37.3866 33 37.7324V40C33 40.5523 32.5523 41 32 41C31.4477 41 31 40.5523 31 40V37.7324C30.4022 37.3866 30 36.7403 30 36C30 34.8954 30.8954 34 32 34Z" fill="#ffffff"/>
                              </svg>
                              <h1 style="color: #ffffff; margin: 20px 0 10px; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Password Reset</h1>
                              <p style="color: #cccccc; margin: 0; font-size: 16px;">Secure your account</p>
                            </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                            <td style="padding: 40px;">
                              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Hello,</p>
                              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">We received a request to reset your password. Use the verification code below to proceed:</p>
                              
                              <!-- OTP Box -->
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td align="center" style="padding: 0 0 32px;">
                                    <div style="background: #fafafa; border: 2px solid #1a1a1a; border-radius: 12px; padding: 32px; display: inline-block;">
                                      <p style="color: #999999; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Reset Code</p>
                                      <p style="color: #1a1a1a; font-size: 48px; font-weight: 700; margin: 0; letter-spacing: 12px; font-family: 'Courier New', monospace;">${code}</p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- Warning Box -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 8px; margin-bottom: 32px;">
                                <tr>
                                  <td style="padding: 16px;">
                                    <p style="color: #ffffff; font-size: 14px; line-height: 1.6; margin: 0;">
                                      <strong>Security Notice:</strong> This code expires in 60 seconds. If you didn't request a password reset, please secure your account immediately.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                              
                              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0;">For your security, never share this code with anyone. AMS staff will never ask for your verification code.</p>
                            </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                            <td style="background-color: #fafafa; padding: 32px 40px; border-top: 1px solid #e0e0e0;">
                              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0 0 8px; text-align: center;">Automated message from AMS</p>
                              <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 0; text-align: center; font-weight: 600;">Appointment Management System</p>
                            </td>
                          </tr>
                          
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
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

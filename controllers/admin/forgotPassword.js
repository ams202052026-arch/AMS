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
            subject: 'Admin Password Reset - AMS',
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
                                <path d="M32 20C27.5817 20 24 23.5817 24 28V30H22C20.8954 30 20 30.8954 20 32V42C20 43.1046 20.8954 44 22 44H42C43.1046 44 44 43.1046 44 42V32C44 30.8954 43.1046 30 42 30H40V28C40 23.5817 36.4183 20 32 20ZM32 22C35.3137 22 38 24.6863 38 28V30H26V28C26 24.6863 28.6863 22 32 22Z" fill="#ffffff"/>
                                <circle cx="32" cy="36" r="2" fill="#1a1a1a"/>
                                <rect x="31" y="36" width="2" height="4" fill="#1a1a1a"/>
                              </svg>
                              <h1 style="color: #ffffff; margin: 20px 0 10px; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Admin Access</h1>
                              <p style="color: #cccccc; margin: 0; font-size: 16px;">Password Reset Request</p>
                            </td>
                          </tr>
                          
                          <!-- Content -->
                          <tr>
                            <td style="padding: 40px;">
                              <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">Hello Administrator,</p>
                              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">A password reset has been requested for your admin account. Use the secure verification code below:</p>
                              
                              <!-- OTP Box -->
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td align="center" style="padding: 0 0 32px;">
                                    <div style="background: #fafafa; border: 2px solid #1a1a1a; border-radius: 12px; padding: 32px; display: inline-block;">
                                      <p style="color: #999999; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Admin Verification Code</p>
                                      <p style="color: #1a1a1a; font-size: 48px; font-weight: 700; margin: 0; letter-spacing: 12px; font-family: 'Courier New', monospace;">${otpCode}</p>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- Info Box -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; border-left: 4px solid #666666; border-radius: 8px; margin-bottom: 24px;">
                                <tr>
                                  <td style="padding: 16px;">
                                    <p style="color: #1a1a1a; font-size: 14px; line-height: 1.6; margin: 0;">
                                      <strong>Valid for 10 minutes</strong> — This code provides access to reset your admin password. Enter it promptly to proceed.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                              
                              <!-- Warning Box -->
                              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 8px; margin-bottom: 32px;">
                                <tr>
                                  <td style="padding: 16px;">
                                    <p style="color: #ffffff; font-size: 14px; line-height: 1.6; margin: 0;">
                                      <strong>Security Alert:</strong> If you did not request this reset, your account may be compromised. Contact the system administrator immediately.
                                    </p>
                                  </td>
                                </tr>
                              </table>
                              
                              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0;">This is a privileged admin operation. Never share this code with anyone.</p>
                            </td>
                          </tr>
                          
                          <!-- Footer -->
                          <tr>
                            <td style="background-color: #fafafa; padding: 32px 40px; border-top: 1px solid #e0e0e0;">
                              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 0 0 8px; text-align: center;">Automated security message from AMS</p>
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
